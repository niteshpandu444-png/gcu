"""Contribution and agent action schemas."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.contribution import ActorType


class ContributionCreate(BaseModel):
    milestone_id: int | None = None
    actor_type: ActorType = ActorType.HUMAN
    actor_id: int | None = None
    human_owner_id: int | None = None
    action: str = Field(min_length=1, max_length=120)
    description: str = ""
    artifact_id: str | None = None
    verified: bool = False

    @model_validator(mode="after")
    def ai_requires_human_owner(self) -> "ContributionCreate":
        if self.actor_type == ActorType.AI and self.human_owner_id is None:
            raise ValueError("human_owner_id is required when actor_type is AI")
        return self


class ContributionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    milestone_id: int | None
    actor_id: int | None
    actor_type: ActorType
    human_owner_id: int | None
    action: str
    description: str
    artifact_id: str | None
    verified: bool
    created_at: datetime


class AgentActionCreate(BaseModel):
    agent_id: str = Field(min_length=1, max_length=120)
    human_owner_id: int | None = None
    action: str = Field(min_length=1, max_length=120)
    tool: str = ""
    input_summary: str = ""
    output_summary: str = ""


class AgentActionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    agent_id: str
    human_owner_id: int | None
    action: str
    tool: str
    input_summary: str
    output_summary: str
    created_at: datetime
