"""Tamper-evident contribution ledger model."""

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base, utcnow


class LedgerEntry(Base):
    """Tamper-evident ledger entry recording critical project lifecycle events."""

    __tablename__ = "ledger_entries"

    id: Mapped[int] = mapped_column(primary_key=True)
    entry_id: Mapped[int] = mapped_column(Integer, index=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), index=True)
    actor_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    actor_name: Mapped[str] = mapped_column(String(120), default="")
    actor_type: Mapped[str] = mapped_column(String(20), default="HUMAN")
    action: Mapped[str] = mapped_column(String(120), index=True)
    artifact_id: Mapped[str | None] = mapped_column(String(120), nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    previous_hash: Mapped[str] = mapped_column(String(64))
    current_hash: Mapped[str] = mapped_column(String(64))
    details: Mapped[str] = mapped_column(Text, default="")

    def __repr__(self) -> str:
        return f"<LedgerEntry #{self.entry_id} p={self.project_id} {self.action} hash={self.current_hash[:8]}>"
