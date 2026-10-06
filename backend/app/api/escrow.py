"""Escrow fund/release and reward endpoints (demo only, no real payments).

Judging flow enforced here: Review (APPROVED) -> Escrow release -> Rewards.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db, utcnow
from app.deps import get_current_user, get_project, require_project_edit
from app.models.escrow import Escrow, EscrowStatus, Payout, PayoutStatus
from app.models.milestone import Milestone, MilestoneStatus
from app.models.project import Project
from app.models.review import Review, ReviewDecision
from app.models.user import User
from app.schemas.escrow import (
    EscrowFundRequest,
    EscrowOut,
    EscrowReleaseRequest,
    RewardOut,
    RewardsOut,
)
from app.services.rewards import calculate_reward_shares, reward_split_rules

router = APIRouter(prefix="/api/projects", tags=["escrow"])


def _get_milestone(db: Session, project: Project, milestone_id: int) -> Milestone:
    milestone = db.get(Milestone, milestone_id)
    if milestone is None or milestone.project_id != project.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Milestone not found in this project")
    return milestone


@router.post("/{project_id}/escrow/fund", response_model=EscrowOut, status_code=status.HTTP_201_CREATED)
def fund_escrow(
    payload: EscrowFundRequest,
    project: Project = Depends(require_project_edit),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> EscrowOut:
    """Fund the escrow for a milestone (sponsor/ADMIN only).

    Creates the escrow row and transparent PENDING payout splits at the same
    time. ``amount`` defaults to the milestone reward.
    """
    milestone = _get_milestone(db, project, payload.milestone_id)
    amount = payload.amount if payload.amount is not None else milestone.reward

    escrow = db.scalar(
        select(Escrow).where(Escrow.project_id == project.id, Escrow.milestone_id == milestone.id)
    )
    if escrow is not None and escrow.status in (EscrowStatus.FUNDED.value, EscrowStatus.RELEASED.value):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Escrow already funded for this milestone")

    if escrow is None:
        escrow = Escrow(project_id=project.id, milestone_id=milestone.id)
        db.add(escrow)
    escrow.amount = amount
    escrow.status = EscrowStatus.FUNDED.value
    escrow.funded_at = utcnow()
    escrow.released_at = None

    # Transparent reward split, recorded up-front as PENDING payouts.
    existing_payouts = db.scalars(select(Payout).where(Payout.milestone_id == milestone.id)).all()
    for payout in existing_payouts:
        db.delete(payout)
    for share in calculate_reward_shares(db, project, amount):
        db.add(
            Payout(
                project_id=project.id,
                milestone_id=milestone.id,
                user_id=share.user_id,
                amount=share.amount,
                reason=share.reason,
                status=PayoutStatus.PENDING.value,
            )
        )

    if milestone.status in (MilestoneStatus.PENDING.value, MilestoneStatus.ACCEPTED.value):
        milestone.status = MilestoneStatus.FUNDED.value

    db.commit()
    db.refresh(escrow)
    return EscrowOut.model_validate(escrow)


@router.post("/{project_id}/escrow/release", response_model=EscrowOut, status_code=status.HTTP_200_OK)
def release_escrow(
    payload: EscrowReleaseRequest,
    project: Project = Depends(require_project_edit),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> EscrowOut:
    """Release escrow payouts for a milestone (sponsor/ADMIN only).

    Requires: escrow FUNDED and an APPROVED review for the milestone
    (Review -> Escrow -> Reward judging flow).
    """
    milestone = _get_milestone(db, project, payload.milestone_id)
    escrow = db.scalar(
        select(Escrow).where(Escrow.project_id == project.id, Escrow.milestone_id == milestone.id)
    )
    if escrow is None or escrow.status == EscrowStatus.PENDING.value:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Escrow is not funded for this milestone")
    if escrow.status == EscrowStatus.RELEASED.value:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Escrow already released for this milestone")

    approved = db.scalar(
        select(Review).where(
            Review.milestone_id == milestone.id,
            Review.decision == ReviewDecision.APPROVED.value,
        )
    )
    if approved is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Milestone has no APPROVED review yet (Review -> Escrow -> Reward)",
        )

    escrow.status = EscrowStatus.RELEASED.value
    escrow.released_at = utcnow()

    for payout in db.scalars(select(Payout).where(Payout.milestone_id == milestone.id)):
        payout.status = PayoutStatus.RELEASED.value

    milestone.status = MilestoneStatus.RELEASED.value

    db.commit()
    db.refresh(escrow)
    return EscrowOut.model_validate(escrow)


@router.get("/{project_id}/rewards", response_model=RewardsOut)
def list_rewards(
    project: Project = Depends(get_project),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RewardsOut:
    """Transparent reward ledger for the project.

    Returns every payout (PENDING or RELEASED) plus the human-readable split
    rules. AI contributions always receive ₹0.
    """
    rows = db.execute(
        select(Payout, User)
        .join(User, User.id == Payout.user_id)
        .where(Payout.project_id == project.id)
        .order_by(Payout.id)
    ).all()

    rewards: list[RewardOut] = []
    for payout, user in rows:
        out = RewardOut.model_validate(payout)
        out.user_name = user.name
        rewards.append(out)

    return RewardsOut(
        project_id=project.id,
        split_rules=reward_split_rules(),
        rewards=rewards,
        total_distributed=sum(r.amount for r in rewards if r.status == PayoutStatus.RELEASED.value),
        total_ai_share=0,
    )
