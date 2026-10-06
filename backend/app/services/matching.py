"""Deterministic, explainable candidate matching service for GCU.

Applies strict hard filters (role, verification status, conflict of interest),
then calculates an explainable match score comparing candidate skills with
project/charter/milestone requirements.
"""

import re
from dataclasses import dataclass
from typing import Any
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.charter import Charter
from app.models.milestone import Milestone
from app.models.project import Project
from app.models.user import Role, User


@dataclass
class CandidateRecommendation:
    user_id: int
    name: str
    role: str
    score: int
    matched_skills: list[str]
    reasons: list[str]

    def to_dict(self) -> dict[str, Any]:
        return {
            "user_id": self.user_id,
            "name": self.name,
            "role": self.role,
            "score": self.score,
            "matched_skills": self.matched_skills,
            "reasons": self.reasons,
        }


DEFAULT_DOMAIN_SKILLS = [
    "Computer Vision",
    "Edge AI",
    "Deep Learning",
    "PyTorch",
    "Medical Imaging",
    "Ophthalmology",
    "AI Ethics",
    "Peer Review",
    "CUDA",
    "MLOps",
    "Quantization",
    "Data Visualization",
]


def extract_required_skills(db: Session, project: Project) -> list[str]:
    """Gather required skill keywords from milestones, charter, and title."""
    req_set: set[str] = set()

    milestones = db.scalars(
        select(Milestone).where(Milestone.project_id == project.id)
    ).all()
    for m in milestones:
        text = f"{m.title} {m.description} {m.deliverable}".lower()
        for skill in DEFAULT_DOMAIN_SKILLS:
            if skill.lower() in text:
                req_set.add(skill)

    charter = db.scalar(
        select(Charter)
        .where(Charter.project_id == project.id)
        .order_by(Charter.version.desc())
        .limit(1)
    )
    if charter:
        text = f"{charter.scope} {charter.ai_rules}".lower()
        for skill in DEFAULT_DOMAIN_SKILLS:
            if skill.lower() in text:
                req_set.add(skill)

    title_text = f"{project.title} {project.public_summary}".lower()
    for skill in DEFAULT_DOMAIN_SKILLS:
        if skill.lower() in title_text:
            req_set.add(skill)

    if not req_set:
        return [
            "Computer Vision",
            "Deep Learning",
            "Edge AI",
            "Medical Imaging",
            "Ophthalmology",
        ]

    return sorted(req_set)


def match_candidates(
    db: Session,
    project: Project,
) -> dict[str, Any]:
    """Find and rank verified expert and student candidates with zero conflicts."""
    required_skills = extract_required_skills(db, project)

    # Hard filters: role must be EXPERT or STUDENT, VERIFIED, no conflict, not sponsor
    candidates = db.scalars(
        select(User).where(
            User.role.in_([Role.EXPERT.value, Role.STUDENT.value]),
            User.verification_status == "VERIFIED",
            User.conflict_of_interest.is_(False),
            User.id != project.sponsor_id,
        )
    ).all()

    experts: list[CandidateRecommendation] = []
    students: list[CandidateRecommendation] = []

    for user in candidates:
        user_skills = [s.strip() for s in (user.skills or "").split(",") if s.strip()]
        matched = []
        for us in user_skills:
            for rs in required_skills:
                if us.lower() in rs.lower() or rs.lower() in us.lower():
                    matched.append(us)
                    break

        # Calculate score (base 50 + skill points up to 45 + no-conflict 5)
        skill_boost = min(len(matched) * 15, 43)
        raw_score = 50 + skill_boost + 5  # No conflict = +5

        # Format reasons checklist
        reasons = [f"✓ {s}" for s in matched]
        reasons.append("✓ Identity Verified")
        reasons.append("✓ No Conflict of Interest")
        if user.role == Role.EXPERT.value:
            reasons.append("✓ Peer Review Qualifications")

        rec = CandidateRecommendation(
            user_id=user.id,
            name=user.name,
            role=user.role,
            score=min(raw_score, 96),
            matched_skills=matched,
            reasons=reasons,
        )

        if user.role == Role.EXPERT.value:
            experts.append(rec)
        else:
            students.append(rec)

    experts.sort(key=lambda x: x.score, reverse=True)
    students.sort(key=lambda x: x.score, reverse=True)

    return {
        "project_id": project.id,
        "required_skills": required_skills,
        "recommended_expert": experts[0].to_dict() if experts else None,
        "recommended_students": [s.to_dict() for s in students[:4]],
    }
