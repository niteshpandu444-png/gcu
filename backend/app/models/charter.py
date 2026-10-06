"""Charter and charter acceptance models."""

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base, utcnow


class Charter(Base):
    __tablename__ = "charters"
    __table_args__ = (UniqueConstraint("project_id", "version", name="uq_project_charter_version"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), index=True)
    version: Mapped[int] = mapped_column(default=1)
    scope: Mapped[str] = mapped_column(Text, default="")
    access_rules: Mapped[str] = mapped_column(Text, default="")
    ip_rules: Mapped[str] = mapped_column(Text, default="")
    ai_rules: Mapped[str] = mapped_column(Text, default="")
    reward_rules: Mapped[str] = mapped_column(Text, default="")
    confidentiality_rules: Mapped[str] = mapped_column(Text, default="")
    commercialisation_rules: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    def __repr__(self) -> str:
        return f"<Charter {self.id} p={self.project_id} v{self.version}>"


class CharterAcceptance(Base):
    __tablename__ = "charter_acceptances"
    __table_args__ = (UniqueConstraint("charter_id", "user_id", name="uq_charter_user"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    charter_id: Mapped[int] = mapped_column(ForeignKey("charters.id"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    accepted_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    def __repr__(self) -> str:
        return f"<CharterAcceptance c={self.charter_id} u={self.user_id}>"
