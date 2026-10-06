"""Milestone schemas."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.milestone import MilestoneStatus


class MilestoneCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str = ""
    deliverable: str = ""
    acceptance_criteria: str = ""
    reward: int = Field(default=0, ge=0)


class MilestoneOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    title: str
    description: str
    deliverable: str
    acceptance_criteria: str
    reward: int
    status: MilestoneStatus
    created_at: datetime
