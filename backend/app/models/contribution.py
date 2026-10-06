"""Contribution and agent action models.

These are the main integration points for the AI teammate and the
trust / ledger teammate (hash chain, artifact IDs, integrity checks).
"""

from datetime import datetime
from enum import Enum

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base, utcnow


class ActorType(str, Enum):
    HUMAN = "HUMAN"
    AI = "AI"


class Contribution(Base):
    """A unit of work recorded against a project.

    If ``actor_type == AI`` then ``human_owner_id`` is required so every AI
    contribution is attributable to a responsible human.
    """

    __tablename__ = "contributions"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), index=True)
    milestone_id: Mapped[int | None] = mapped_column(ForeignKey("milestones.id"), nullable=True, index=True)
    actor_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    actor_type: Mapped[str] = mapped_column(String(10), default=ActorType.HUMAN.value)
    human_owner_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    action: Mapped[str] = mapped_column(String(120))
    description: Mapped[str] = mapped_column(Text, default="")
    artifact_id: Mapped[str | None] = mapped_column(String(120), nullable=True, index=True)
    verified: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    def __repr__(self) -> str:
        return f"<Contribution {self.id} p={self.project_id} {self.actor_type} {self.action!r}>"


class AgentAction(Base):
    """A log entry emitted by an AI agent (no AI logic runs here)."""

    __tablename__ = "agent_actions"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), index=True)
    agent_id: Mapped[str] = mapped_column(String(120), index=True)
    human_owner_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    action: Mapped[str] = mapped_column(String(120))
    tool: Mapped[str] = mapped_column(String(120), default="")
    input_summary: Mapped[str] = mapped_column(Text, default="")
    output_summary: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    def __repr__(self) -> str:
        return f"<AgentAction {self.id} p={self.project_id} agent={self.agent_id!r}>"
