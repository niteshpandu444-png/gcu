"""AI project scoping: LLM-generated milestones with a deterministic fallback."""

import json
import logging
import re

from app.schemas.ai import ScopeMilestone, ScopeResponse
from app.services.ai import llm

logger = logging.getLogger("gcu.ai")

SCOPE_SYSTEM_PROMPT = (
    "You are a research project scoping assistant for academic innovation "
    "projects. Given a problem statement, propose EXACTLY 2 milestones as "
    "valid JSON with this shape and no extra text:\n"
    '{"milestones": [{"title": str, "description": str, '
    '"required_skills": [str], "deliverable": str, '
    '"acceptance_criteria": [str]}]}'
)

# Deterministic demo fallback (used when the LLM is unavailable).
FALLBACK_MILESTONES = [
    ScopeMilestone(
        title="Dataset and Baseline",
        description=(
            "Curate and label the dataset, establish a training pipeline, "
            "and produce a baseline model with an evaluation report."
        ),
        required_skills=["Python", "Computer Vision", "Machine Learning"],
        deliverable="Baseline diabetic-retinopathy classification model and evaluation report",
        acceptance_criteria=[
            "Dataset is documented, labelled, and split reproducibly",
            "Baseline model metrics are reported against a held-out test set",
        ],
    ),
    ScopeMilestone(
        title="Edge Optimization and Validation",
        description=(
            "Quantise and optimise the baseline model for edge hardware and "
            "validate accuracy and latency on the target device."
        ),
        required_skills=["Python", "Edge AI", "Model Optimization"],
        deliverable="Optimized edge-compatible model with latency and accuracy evaluation",
        acceptance_criteria=[
            "Model runs on target edge hardware within the latency budget",
            "Accuracy drop after optimisation stays within the agreed tolerance",
        ],
    ),
]


def _extract_json(text: str) -> dict:
    """Parse JSON from the LLM reply, tolerating ```json fences."""
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if not match:
        raise ValueError("no JSON object in LLM response")
    return json.loads(match.group(0))


def generate_scope(problem: str) -> ScopeResponse:
    """Generate milestones for a problem statement.

    Always returns a valid response: falls back to the deterministic demo
    milestones if the LLM is missing, fails, or returns malformed JSON.
    """
    raw = llm.chat_completion(SCOPE_SYSTEM_PROMPT, f"Problem statement:\n{problem}")
    if raw is not None:
        try:
            data = _extract_json(raw)
            milestones = [ScopeMilestone.model_validate(m) for m in data["milestones"]]
            if milestones:
                return ScopeResponse(project_id=0, milestones=milestones, source="llm")
        except Exception as exc:  # noqa: BLE001 — malformed LLM output => fallback
            logger.warning("Malformed scope response from LLM, using fallback: %s", exc)
    return ScopeResponse(project_id=0, milestones=list(FALLBACK_MILESTONES), source="fallback")
