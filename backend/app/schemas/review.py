"""Review schemas."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.review import ReviewDecision


class ReviewCreate(BaseModel):
    milestone_id: int
    decision: ReviewDecision = ReviewDecision.PENDING
    comment: str = ""


class ReviewOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    milestone_id: int
    reviewer_id: int
    decision: ReviewDecision
    comment: str
    created_at: datetime
