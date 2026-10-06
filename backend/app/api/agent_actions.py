"""Agent action logging endpoints (used by the separate AI teammate)."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user, get_project
from app.models.contribution import AgentAction
from app.models.project import Project
from app.models.user import User
from app.schemas.contribution import AgentActionCreate, AgentActionOut

router = APIRouter(prefix="/api/projects", tags=["agent-actions"])


@router.post("/{project_id}/agent-actions", response_model=AgentActionOut, status_code=status.HTTP_201_CREATED)
def log_agent_action(
    payload: AgentActionCreate,
    project: Project = Depends(get_project),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AgentActionOut:
    """Log an AI agent action. No AI runs here — the AI teammate posts logs.

    ``human_owner_id`` defaults to the authenticated user when omitted.
    """
    human_owner_id = payload.human_owner_id if payload.human_owner_id is not None else current_user.id
    if db.get(User, human_owner_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="human_owner_id user not found")

    action = AgentAction(
        project_id=project.id,
        agent_id=payload.agent_id,
        human_owner_id=human_owner_id,
        action=payload.action,
        tool=payload.tool,
        input_summary=payload.input_summary,
        output_summary=payload.output_summary,
    )
    db.add(action)
    db.commit()
    db.refresh(action)
    return AgentActionOut.model_validate(action)


@router.get("/{project_id}/agent-actions", response_model=list[AgentActionOut])
def list_agent_actions(
    project: Project = Depends(get_project),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    agent_id: str | None = None,
) -> list[AgentActionOut]:
    """List agent actions, optionally filtered by ``agent_id``."""
    stmt = select(AgentAction).where(AgentAction.project_id == project.id)
    if agent_id is not None:
        stmt = stmt.where(AgentAction.agent_id == agent_id)
    actions = db.scalars(stmt.order_by(AgentAction.id)).all()
    return [AgentActionOut.model_validate(a) for a in actions]
