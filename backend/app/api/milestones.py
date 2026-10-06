"""Milestone endpoints."""

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user, get_project, require_project_edit
from app.models.milestone import Milestone
from app.models.project import Project
from app.models.user import User
from app.schemas.milestone import MilestoneCreate, MilestoneOut

router = APIRouter(prefix="/api/projects", tags=["milestones"])


@router.post("/{project_id}/milestones", response_model=MilestoneOut, status_code=status.HTTP_201_CREATED)
def create_milestone(
    payload: MilestoneCreate,
    project: Project = Depends(require_project_edit),
    db: Session = Depends(get_db),
) -> MilestoneOut:
    """Create a milestone (sponsor/ADMIN only)."""
    milestone = Milestone(project_id=project.id, **payload.model_dump())
    db.add(milestone)
    db.commit()
    db.refresh(milestone)
    return MilestoneOut.model_validate(milestone)


@router.get("/{project_id}/milestones", response_model=list[MilestoneOut])
def list_milestones(
    project: Project = Depends(get_project),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[MilestoneOut]:
    """List all milestones of a project."""
    milestones = db.scalars(
        select(Milestone).where(Milestone.project_id == project.id).order_by(Milestone.id)
    ).all()
    return [MilestoneOut.model_validate(m) for m in milestones]
