"""Escrow and payout models (demo only, no real payments)."""

from datetime import datetime
from enum import Enum

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base, utcnow


class EscrowStatus(str, Enum):
    PENDING = "PENDING"
    FUNDED = "FUNDED"
    RELEASED = "RELEASED"
    DISPUTED = "DISPUTED"


class PayoutStatus(str, Enum):
    PENDING = "PENDING"
    RELEASED = "RELEASED"


class Escrow(Base):
    __tablename__ = "escrows"
    __table_args__ = (UniqueConstraint("project_id", "milestone_id", name="uq_escrow_project_milestone"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), index=True)
    milestone_id: Mapped[int] = mapped_column(ForeignKey("milestones.id"), index=True)
    amount: Mapped[int] = mapped_column(default=0)
    status: Mapped[str] = mapped_column(String(20), default=EscrowStatus.PENDING.value)
    funded_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    released_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    def __repr__(self) -> str:
        return f"<Escrow {self.id} m={self.milestone_id} {self.status} {self.amount}>"


class Payout(Base):
    """A single beneficiary's share of a milestone reward."""

    __tablename__ = "payouts"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), index=True)
    milestone_id: Mapped[int] = mapped_column(ForeignKey("milestones.id"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    amount: Mapped[int] = mapped_column(default=0)
    reason: Mapped[str] = mapped_column(String(255), default="")
    status: Mapped[str] = mapped_column(String(20), default=PayoutStatus.PENDING.value)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    def __repr__(self) -> str:
        return f"<Payout {self.id} u={self.user_id} {self.amount} {self.status}>"
