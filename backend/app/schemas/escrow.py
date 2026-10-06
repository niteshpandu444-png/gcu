"""Escrow and reward schemas."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.escrow import EscrowStatus, PayoutStatus


class EscrowFundRequest(BaseModel):
    milestone_id: int
    amount: int | None = Field(default=None, ge=0, description="Defaults to the milestone reward")


class EscrowReleaseRequest(BaseModel):
    milestone_id: int


class EscrowOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    milestone_id: int
    amount: int
    status: EscrowStatus
    funded_at: datetime | None
    released_at: datetime | None


class RewardOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    milestone_id: int
    user_id: int
    user_name: str = ""
    amount: int
    reason: str
    status: PayoutStatus
    created_at: datetime


class RewardsOut(BaseModel):
    """Transparent reward summary for a project."""

    project_id: int
    split_rules: list[str]
    rewards: list[RewardOut]
    total_distributed: int = 0
    total_ai_share: int = 0
