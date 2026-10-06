"""Contribution endpoints — main integration point for the AI and ledger teammates."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user, get_project
from app.models.contribution import ActorType, Contribution
from app.models.milestone import Milestone, MilestoneStatus
from app.models.project import Project
from app.models.user import User
from app.schemas.contribution import ContributionCreate, ContributionOut
from app.services.ledger import record_ledger_entry

router = APIRouter(prefix="/api/projects", tags=["contributions"])


@router.post("/{project_id}/contributions", response_model=ContributionOut, status_code=status.HTTP_201_CREATED)
def create_contribution(
    payload: ContributionCreate,
    project: Project = Depends(get_project),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ContributionOut:
    """Record a contribution.

    ``actor_id`` defaults to the authenticated user (may be overridden by the
    integrating teammate). ``actor_type=AI`` requires ``human_owner_id`` —
    enforced by the schema. The contribution carries stable ids and timestamps
    for the trust/ledger teammate.
    """
    if payload.milestone_id is not None:
        milestone = db.get(Milestone, payload.milestone_id)
        if milestone is None or milestone.project_id != project.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Milestone not found in this project")

    actor_id = payload.actor_id if payload.actor_id is not None else current_user.id
    actor = db.get(User, actor_id)
    if actor is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="actor_id user not found")

    human_owner_id = payload.human_owner_id
    if human_owner_id is None and payload.actor_type == ActorType.HUMAN:
        human_owner_id = actor_id
    if human_owner_id is not None and db.get(User, human_owner_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="human_owner_id user not found")

    contribution = Contribution(
        project_id=project.id,
        milestone_id=payload.milestone_id,
        actor_id=actor_id,
        actor_type=payload.actor_type.value,
        human_owner_id=human_owner_id,
        action=payload.action,
        description=payload.description,
        artifact_id=payload.artifact_id,
        verified=payload.verified,
    )
    db.add(contribution)

    # Coherent milestone progression: work submitted for a milestone.
    if payload.milestone_id is not None:
        milestone = db.get(Milestone, payload.milestone_id)
        if milestone is not None and milestone.status in (
            MilestoneStatus.PENDING.value,
            MilestoneStatus.FUNDED.value,
        ):
            milestone.status = MilestoneStatus.SUBMITTED.value

    db.commit()
    db.refresh(contribution)

    if contribution.artifact_id:
        actor_name = actor.name if actor else ""
        record_ledger_entry(
            db,
            project_id=project.id,
            action="ARTIFACT_SUBMITTED",
            actor_id=actor_id,
            actor_type="AI" if contribution.actor_type == ActorType.AI.value else "HUMAN",
            actor_name=actor_name,
            artifact_id=contribution.artifact_id,
            details=f"{contribution.action}: {contribution.description[:120]}",
        )
    return ContributionOut.model_validate(contribution)


@router.get("/{project_id}/contributions", response_model=list[ContributionOut])
def list_contributions(
    project: Project = Depends(get_project),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    milestone_id: int | None = None,
) -> list[ContributionOut]:
    """List contributions, optionally filtered by ``milestone_id``."""
    stmt = select(Contribution).where(Contribution.project_id == project.id)
    if milestone_id is not None:
        stmt = stmt.where(Contribution.milestone_id == milestone_id)
    contributions = db.scalars(stmt.order_by(Contribution.id)).all()
    return [ContributionOut.model_validate(c) for c in contributions]
