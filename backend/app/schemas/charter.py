"""Charter schemas."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class CharterCreate(BaseModel):
    scope: str = ""
    access_rules: str = ""
    ip_rules: str = ""
    ai_rules: str = ""
    reward_rules: str = ""
    dispute_rules: str = ""
    confidentiality_rules: str = ""
    commercialisation_rules: str = ""


class CharterOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    version: int
    status: str = "DRAFT"
    approved_by: int | None = None
    approved_at: datetime | None = None
    scope: str
    access_rules: str
    ip_rules: str
    ai_rules: str
    reward_rules: str
    dispute_rules: str = ""
    confidentiality_rules: str
    commercialisation_rules: str
    created_at: datetime


class CharterAcceptanceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    charter_id: int
    user_id: int
    accepted_at: datetime
