"""Project and membership schemas."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.project import Confidentiality, MemberStatus, ProjectStatus
from app.models.user import Role


class ProjectCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    public_summary: str = ""
    confidential_brief: str = ""
    funding: int = Field(default=0, ge=0)
    confidentiality: Confidentiality = Confidentiality.INTERNAL
    code: str | None = Field(default=None, max_length=50, description="Optional project code, e.g. GCU-DEMO-001")


class ProjectOut(BaseModel):
    """Public project view. ``confidential_brief`` is only populated when the
    caller passes the ``can_access_confidential_brief`` policy check."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    sponsor_id: int
    title: str
    public_summary: str
    confidential_brief: str | None = None
    funding: int
    confidentiality: Confidentiality
    status: ProjectStatus
    created_at: datetime
    can_view_confidential_brief: bool = False
    code: str | None = None


class MemberAdd(BaseModel):
    user_id: int
    role: Role | None = None
    status: MemberStatus = MemberStatus.INVITED


class MemberOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    user_id: int
    role: Role
    status: MemberStatus
    joined_at: datetime
    user_name: str = ""
    user_email: str = ""
    skills: str = ""
