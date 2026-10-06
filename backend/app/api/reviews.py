"""Milestone review endpoints (EXPERT / ADMIN only)."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user, get_project, require_roles
from app.models.milestone import Milestone, MilestoneStatus
from app.models.project import Project
from app.models.review import Review, ReviewDecision
from app.models.user import Role, User
from app.schemas.review import ReviewCreate, ReviewOut

router = APIRouter(prefix="/api/projects", tags=["reviews"])

_DECISION_TO_MILESTONE_STATUS = {
    ReviewDecision.PENDING.value: MilestoneStatus.UNDER_REVIEW.value,
    ReviewDecision.APPROVED.value: MilestoneStatus.ACCEPTED.value,
    ReviewDecision.REJECTED.value: MilestoneStatus.REJECTED.value,
}


@router.post("/{project_id}/reviews", response_model=ReviewOut, status_code=status.HTTP_201_CREATED)
def create_review(
    payload: ReviewCreate,
    project: Project = Depends(get_project),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(Role.EXPERT, Role.ADMIN)),
) -> ReviewOut:
    """Submit a milestone review. EXPERT (or ADMIN) only."""
    milestone = db.get(Milestone, payload.milestone_id)
    if milestone is None or milestone.project_id != project.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Milestone not found in this project")

    review = Review(
        project_id=project.id,
        milestone_id=payload.milestone_id,
        reviewer_id=current_user.id,
        decision=payload.decision.value,
        comment=payload.comment,
    )
    db.add(review)
    milestone.status = _DECISION_TO_MILESTONE_STATUS[payload.decision.value]
    db.commit()
    db.refresh(review)
    return ReviewOut.model_validate(review)


@router.get("/{project_id}/reviews", response_model=list[ReviewOut])
def list_reviews(
    project: Project = Depends(get_project),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    milestone_id: int | None = None,
) -> list[ReviewOut]:
    """List reviews, optionally filtered by ``milestone_id``."""
    stmt = select(Review).where(Review.project_id == project.id)
    if milestone_id is not None:
        stmt = stmt.where(Review.milestone_id == milestone_id)
    reviews = db.scalars(stmt.order_by(Review.id)).all()
    return [ReviewOut.model_validate(r) for r in reviews]
