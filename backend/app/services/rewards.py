"""Transparent reward split calculation (demo rules).

Rule for the hackathon demo, milestone reward = ₹50,000:

    Student A = 50% -> ₹25,000
    Student B = 30% -> ₹15,000
    Expert    = 20% -> ₹10,000
    AI        = 0%  -> ₹0

The split is computed from the project's ACTIVE student/expert membership so
it stays correct even if the demo seed changes. Shares are fixed percentages
of the milestone reward, in this priority order:

    1. Active students (ordered by membership id) get 50%, 30%, then 10%
       each for any further students (capped so the total never exceeds 100%).
    2. Active experts share the remaining 20% equally.
    3. AI contributions always receive ₹0 (human_owner_id is the beneficiary
       of record, never a separate AI payout).
"""

from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.project import MemberStatus, Project, ProjectMember
from app.models.user import Role, User

# Fixed demo split percentages.
STUDENT_PERCENTAGES: list[int] = [50, 30, 10]
EXPERT_TOTAL_PERCENTAGE: int = 20


@dataclass
class RewardShare:
    user_id: int
    user_name: str
    percentage: int
    amount: int
    reason: str


def _active_members(db: Session, project_id: int) -> list[tuple[ProjectMember, User]]:
    """Return (member, user) pairs for ACTIVE memberships, ordered by join order."""
    rows = db.execute(
        select(ProjectMember, User)
        .join(User, User.id == ProjectMember.user_id)
        .where(
            ProjectMember.project_id == project_id,
            ProjectMember.status == MemberStatus.ACTIVE.value,
        )
        .order_by(ProjectMember.id)
    ).all()
    return [(member, user) for member, user in rows]


def calculate_reward_shares(db: Session, project: Project, milestone_reward: int) -> list[RewardShare]:
    """Compute the transparent reward split for a milestone reward amount."""
    members = _active_members(db, project.id)
    students = [(m, u) for m, u in members if u.role == Role.STUDENT.value]
    experts = [(m, u) for m, u in members if u.role == Role.EXPERT.value]

    shares: list[RewardShare] = []
    assigned = 0

    for index, (_member, user) in enumerate(students):
        percentage = STUDENT_PERCENTAGES[index] if index < len(STUDENT_PERCENTAGES) else 0
        if percentage == 0:
            continue
        amount = milestone_reward * percentage // 100
        letter = chr(ord("A") + index)
        shares.append(
            RewardShare(
                user_id=user.id,
                user_name=user.name,
                percentage=percentage,
                amount=amount,
                reason=f"Student {letter} share: {percentage}% of ₹{milestone_reward}",
            )
        )
        assigned += percentage

    # Experts split up to 20% equally, never exceeding 100% in total.
    remaining = min(EXPERT_TOTAL_PERCENTAGE, max(100 - assigned, 0))

    if experts and remaining > 0:
        per_expert = remaining // len(experts)
        remainder = remaining - per_expert * len(experts)
        for index, (_member, user) in enumerate(experts):
            percentage = per_expert + (1 if index < remainder else 0)
            amount = milestone_reward * percentage // 100
            shares.append(
                RewardShare(
                    user_id=user.id,
                    user_name=user.name,
                    percentage=percentage,
                    amount=amount,
                    reason=f"Expert share: {percentage}% of ₹{milestone_reward}",
                )
            )

    return shares


def reward_split_rules() -> list[str]:
    """Human readable explanation of the reward split (shown in API responses)."""
    return [
        "Milestone reward is split by fixed percentages:",
        "Student A = 50%, Student B = 30%, further students = 10% each",
        "Active experts share 20% equally among themselves",
        "AI contributions = 0% (rewards only go to human owners)",
        "Example for a ₹50,000 milestone: Student A ₹25,000, Student B ₹15,000, Expert ₹10,000",
    ]
