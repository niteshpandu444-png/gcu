"""User model."""

from datetime import datetime
from enum import Enum

from sqlalchemy import Boolean, DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base, utcnow


class Role(str, Enum):
    """Application roles. Basic role checks happen in the backend."""

    STUDENT = "STUDENT"
    EXPERT = "EXPERT"
    SPONSOR = "SPONSOR"
    ADMIN = "ADMIN"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(20), default=Role.STUDENT.value)
    skills: Mapped[str] = mapped_column(Text, default="")
    verification_status: Mapped[str] = mapped_column(String(20), default="UNVERIFIED")
    conflict_of_interest: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    def __repr__(self) -> str:
        return f"<User {self.id} {self.email} {self.role}>"
