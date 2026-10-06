"""AI charter generation: LLM-generated charter sections + deterministic fallback.

The fallback is the demo specification for GCU-DEMO-001: 2 milestones, the
required skills, and every charter section (scope, access, IP, AI, reward,
dispute, confidentiality, commercialisation). AI proposes — only a human
sponsor/admin can approve.
"""

import json
import logging
import re

from app.schemas.ai import ScopeMilestone
from app.services.ai import llm
from app.services.ai.scoping import FALLBACK_MILESTONES

logger = logging.getLogger("gcu.ai")

CHARTER_SYSTEM_PROMPT = (
    "You are a research charter drafting assistant. Given a project title and "
    "problem statement, return ONLY a JSON object with these string keys and "
    "no extra text:\n"
    '{"scope": str, "access_rules": str, "ip_rules": str, "ai_rules": str, '
    '"reward_rules": str, "dispute_rules": str, "confidentiality_rules": str, '
    '"commercialisation_rules": str}'
)

_SECTION_KEYS = (
    "scope",
    "access_rules",
    "ip_rules",
    "ai_rules",
    "reward_rules",
    "dispute_rules",
    "confidentiality_rules",
    "commercialisation_rules",
)

FALLBACK_SECTIONS: dict[str, str] = {
    "scope": (
        "Two milestones: (1) Dataset & Baseline — curate a labelled dataset, "
        "train and evaluate a baseline model; (2) Edge Optimization & "
        "Validation — quantise the model and validate accuracy/latency on "
        "target edge hardware. Required skills: Python, Computer Vision, "
        "Machine Learning, Edge AI, Model Optimization."
    ),
    "access_rules": (
        "Access is granted only to invited candidates who read and ACCEPT "
        "this charter. Only ACTIVE members may view the confidential brief "
        "and workspace. The sponsor and platform admin retain oversight. "
        "Rejection or revocation immediately removes access."
    ),
    "ip_rules": (
        "Intellectual property created in the project is jointly owned by "
        "the contributing members and the sponsor, pro-rata to reviewed "
        "contributions. Pre-existing IP remains with its owner."
    ),
    "ai_rules": (
        "AI agents (SCOPING-AGENT-001, RESEARCH-AGENT-001, MATCHING-AGENT-001) "
        "may assist but every AI action is logged with agent_id, project_id, "
        "human_owner_id and timestamp. AI output is attributed to the human "
        "owner who invoked it. AI never approves charters, reviews or rewards."
    ),
    "reward_rules": (
        "Milestone rewards split by reviewed contribution: Student A 50%, "
        "Student B 30%, Expert 20%, AI 0%. Rewards follow the reviewed "
        "contribution impact and are paid from released escrow only."
    ),
    "dispute_rules": (
        "Disputes are raised with the expert reviewer first, then escalate to "
        "the sponsor; the tamper-evident ledger is the audit reference. "
        "Unresolved disputes freeze the milestone's escrow release."
    ),
    "confidentiality_rules": (
        "Project brief, datasets and workspace artefacts are INTERNAL by "
        "default. Confidential data is never exposed to non-members and is "
        "only released after charter acceptance and ACTIVE membership."
    ),
    "commercialisation_rules": (
        "Sponsor holds first rights to commercialise results; contributing "
        "members share attribution and any revenue according to the reward "
        "rules above."
    ),
}

FALLBACK_REQUIRED_SKILLS = ["Python", "Computer Vision", "Machine Learning", "Edge AI", "Model Optimization"]


def _extract_json(text: str) -> dict:
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if not match:
        raise ValueError("no JSON object in LLM response")
    return json.loads(match.group(0))


def generate_charter(title: str, problem: str) -> dict:
    """Generate charter sections + required skills + suggested milestones.

    Always returns a usable result: deterministic fallback when the LLM is
    missing, fails, or returns malformed JSON.
    """
    source = "fallback"
    sections = dict(FALLBACK_SECTIONS)

    raw = llm.chat_completion(
        CHARTER_SYSTEM_PROMPT,
        f"Project title: {title}\nProblem statement:\n{problem}",
    )
    if raw is not None:
        try:
            data = _extract_json(raw)
            if all(isinstance(data.get(k), str) and data[k].strip() for k in _SECTION_KEYS):
                sections = {k: data[k] for k in _SECTION_KEYS}
                source = "llm"
        except Exception as exc:  # noqa: BLE001 — malformed LLM output => fallback
            logger.warning("Malformed charter response from LLM, using fallback: %s", exc)

    milestones: list[ScopeMilestone] = list(FALLBACK_MILESTONES)
    required_skills: list[str] = []
    for m in milestones:
        for skill in m.required_skills:
            if skill not in required_skills:
                required_skills.append(skill)
    for skill in FALLBACK_REQUIRED_SKILLS:
        if skill not in required_skills:
            required_skills.append(skill)

    return {
        "sections": sections,
        "required_skills": required_skills,
        "milestones": milestones,
        "source": source,
    }
