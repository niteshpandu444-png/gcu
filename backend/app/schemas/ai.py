"""AI module request/response schemas."""

from pydantic import BaseModel, Field


class ScopeRequest(BaseModel):
    project_id: int | str = Field(description="Project id (1) or project code (GCU-DEMO-001)")
    problem: str = Field(min_length=5, max_length=4000, description="Problem statement to scope")


class ScopeMilestone(BaseModel):
    title: str
    description: str
    required_skills: list[str]
    deliverable: str
    acceptance_criteria: list[str]


class ScopeResponse(BaseModel):
    project_id: int | str
    milestones: list[ScopeMilestone]
    source: str = Field(description="'llm' or 'fallback'")


class ResearchRequest(BaseModel):
    project_id: int | str = Field(description="Project id (1) or project code (GCU-DEMO-001)")
    human_owner_id: int | str | None = Field(
        default=None,
        description="Owner user id or name (e.g. STUDENT-001); defaults to the authenticated user",
    )
    question: str = Field(min_length=3, max_length=4000)


class ResearchResponse(BaseModel):
    project_id: int | str
    agent_id: str
    human_owner_id: int | str
    answer: str
    sources: list[str]
    source: str = Field(description="'llm' or 'fallback'")
