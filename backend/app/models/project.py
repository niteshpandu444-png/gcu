"""Project and project membership models."""

from datetime import datetime
from enum import Enum

from sqlalchemy import DateTime, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base, utcnow


class ProjectStatus(str, Enum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CLOSED = "CLOSED"


class Confidentiality(str, Enum):
    PUBLIC = "PUBLIC"
    INTERNAL = "INTERNAL"
    HIGH = "HIGH"


class MemberStatus(str, Enum):
    INVITED = "INVITED"
    ACTIVE = "ACTIVE"
    REJECTED = "REJECTED"
    LEFT = "LEFT"
    REVOKED = "REVOKED"


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(primary_key=True)
    sponsor_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    title: Mapped[str] = mapped_column(String(255))
    # Optional human-friendly project code (e.g. "GCU-DEMO-001") used by the
    # AI endpoints; NULL for projects that were created without one.
    code: Mapped[str | None] = mapped_column(String(50), nullable=True, default=None)
    public_summary: Mapped[str] = mapped_column(Text, default="")
    confidential_brief: Mapped[str] = mapped_column(Text, default="")
    funding: Mapped[int] = mapped_column(default=0)
    confidentiality: Mapped[str] = mapped_column(String(20), default=Confidentiality.INTERNAL.value)
    status: Mapped[str] = mapped_column(String(20), default=ProjectStatus.OPEN.value)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    def __repr__(self) -> str:
        return f"<Project {self.id} {self.title!r}>"


class ProjectMember(Base):
    __tablename__ = "project_members"
    __table_args__ = (UniqueConstraint("project_id", "user_id", name="uq_project_user"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    role: Mapped[str] = mapped_column(String(20), default="MEMBER")
    status: Mapped[str] = mapped_column(String(20), default=MemberStatus.ACTIVE.value)
    # Charter version accepted by this member at (or before) activation.
    charter_version: Mapped[int | None] = mapped_column(nullable=True, default=None)
    joined_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    def __repr__(self) -> str:
        return f"<ProjectMember p={self.project_id} u={self.user_id} {self.status}>"
