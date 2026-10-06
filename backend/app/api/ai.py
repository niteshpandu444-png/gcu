"""AI endpoints: project scoping and the project-scoped research agent.

Both endpoints:
  * authenticate the caller (Bearer token),
  * resolve + authorize the project through the policy layer,
  * keep retrieval strictly project-scoped,
  * log an AgentAction and an AI Contribution with a human owner,
  * always return a normal success response (deterministic LLM fallback).
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models.contribution import ActorType, AgentAction, Contribution
from app.models.project import Project
from app.models.user import User
from app.schemas.ai import ResearchRequest, ResearchResponse, ScopeRequest, ScopeResponse
from app.services.ai import agent as research_agent
from app.services.ai import scoping
from app.services.policy import can_use_project_agent, is_active_member

router = APIRouter(prefix="/api/ai", tags=["ai"])


def _resolve_project(db: Session, project_ref: int | str) -> Project:
    """Resolve a project id (int/str) or project code (GCU-DEMO-001).

    Never trusts the raw reference: unknown refs raise 404 before anything
    else happens.
    """
    ref = str(project_ref).strip()
    project: Project | None = None
    if ref.isdigit():
        project = db.get(Project, int(ref))
    if project is None and ref:
        project = db.scalar(
            select(Project).where(Project.code == ref)
        )
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project not found: {project_ref}",
        )
    return project


def _authorize_project(db: Session, user: User, project: Project) -> None:
    """AI access gate: sponsor, ACTIVE member, or ADMIN only."""
    if not can_use_project_agent(db, user, project):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this project's AI agent",
        )


def _resolve_owner(
    db: Session,
    user: User,
    project: Project,
    owner_ref: int | str | None,
) -> User:
    """Resolve human_owner_id (id or name, e.g. STUDENT-001).

    Defaults to the authenticated user. An explicit owner must be the caller
    themselves, an ACTIVE project member, or the project sponsor — the AI can
    never be attributed to an arbitrary user.
    """
    if owner_ref is None:
        return user
    ref = str(owner_ref).strip()
    owner: User | None = None
    if ref.isdigit():
        owner = db.get(User, int(ref))
    if owner is None and ref:
        owner = db.scalar(select(User).where(User.name == ref))
    if owner is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Human owner not found: {owner_ref}",
        )
    if (
        owner.id != user.id
        and project.sponsor_id != owner.id
        and not is_active_member(db, owner, project.id)
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="human_owner_id must be you, the sponsor, or an ACTIVE project member",
        )
    return owner


def _log_ai_action(
    db: Session,
    *,
    project: Project,
    user: User,
    owner: User,
    agent_id: str,
    action: str,
    input_summary: str,
    output_summary: str,
    contribution_description: str,
) -> None:
    """Record the operation in the EXISTING agent-action + contribution tables."""
    db.add(
        AgentAction(
            project_id=project.id,
            agent_id=agent_id,
            human_owner_id=owner.id,
            action=action,
            input_summary=input_summary,
            output_summary=output_summary,
        )
    )
    db.add(
        Contribution(
            project_id=project.id,
            milestone_id=None,
            actor_id=user.id,
            actor_type=ActorType.AI.value,
            human_owner_id=owner.id,
            action=action,
            description=contribution_description,
            artifact_id=None,
            verified=False,
        )
    )
    db.commit()


@router.post("/scope", response_model=ScopeResponse)
def scope(
    payload: ScopeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ScopeResponse:
    """Generate milestone suggestions for a problem statement (AI_SCOPE_GENERATION)."""
    project = _resolve_project(db, payload.project_id)
    _authorize_project(db, current_user, project)

    result = scoping.generate_scope(payload.problem)
    result.project_id = payload.project_id

    _log_ai_action(
        db,
        project=project,
        user=current_user,
        owner=current_user,
        agent_id="SCOPING-AGENT-001",
        action="AI_SCOPE_GENERATION",
        input_summary=f"Scope problem: {payload.problem[:180]}",
        output_summary=f"{len(result.milestones)} milestones ({result.source})",
        contribution_description=(
            f"AI generated {len(result.milestones)} milestone proposals "
            f"({result.source}): {payload.problem[:120]}"
        ),
    )
    return result


@router.post("/research", response_model=ResearchResponse)
def research(
    payload: ResearchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ResearchResponse:
    """Answer a project-scoped question via the research agent (AI_RESEARCH_QUERY)."""
    project = _resolve_project(db, payload.project_id)
    _authorize_project(db, current_user, project)
    owner = _resolve_owner(db, current_user, project, payload.human_owner_id)

    answer, sources, source = research_agent.answer_question(project, payload.question)

    _log_ai_action(
        db,
        project=project,
        user=current_user,
        owner=owner,
        agent_id=research_agent.AGENT_ID,
        action="AI_RESEARCH_QUERY",
        input_summary=f"Q: {payload.question[:180]}",
        output_summary=f"A ({source}): {answer[:180]}",
        contribution_description=f"AI answered research question ({source}): {payload.question[:120]}",
    )

    return ResearchResponse(
        project_id=payload.project_id,
        agent_id=research_agent.AGENT_ID,
        human_owner_id=payload.human_owner_id
        if payload.human_owner_id is not None
        else owner.name,
        answer=answer,
        sources=sources,
        source=source,
    )
