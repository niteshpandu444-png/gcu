"""Seed demo data for the GCU hackathon backend.

Run from the backend/ directory:

    python seed.py

It creates tables if needed, then inserts:
  - 6 demo users (SPONSOR-001 ... ADMIN-001), password for all: password123
  - 1 demo project (diabetic retinopathy / edge devices)
  - demo project membership
  - 2 milestones (₹50,000 each)

The script is idempotent: re-running it does not duplicate data.
"""

from sqlalchemy import select

from app import models  # noqa: F401
from app.database import Base, SessionLocal, ensure_columns, engine
from app.models import (
    Confidentiality,
    MemberStatus,
    Milestone,
    Project,
    ProjectMember,
    Role,
    User,
)
from app.services.security import hash_password

DEMO_PASSWORD = "password123"

DEMO_USERS: list[dict[str, str]] = [
    {"name": "SPONSOR-001", "email": "sponsor-001@gcu.demo", "role": Role.SPONSOR.value,
     "skills": "Funding, Medical Devices, Clinical Research"},
    {"name": "EXPERT-001", "email": "expert-001@gcu.demo", "role": Role.EXPERT.value,
     "skills": "Ophthalmology, AI Ethics, Peer Review"},
    {"name": "STUDENT-001", "email": "student-001@gcu.demo", "role": Role.STUDENT.value,
     "skills": "Deep Learning, PyTorch, Medical Imaging"},
    {"name": "STUDENT-002", "email": "student-002@gcu.demo", "role": Role.STUDENT.value,
     "skills": "Edge Deployment, CUDA, MLOps"},
    {"name": "STUDENT-003", "email": "student-003@gcu.demo", "role": Role.STUDENT.value,
     "skills": "Frontend, Data Visualization"},
    {"name": "ADMIN-001", "email": "admin-001@gcu.demo", "role": Role.ADMIN.value,
     "skills": "Platform Administration"},
]

DEMO_PROJECT = {
    "code": "GCU-DEMO-001",
    "title": "Low-cost detection of diabetic retinopathy from fundus images on edge devices",
    "public_summary": "Develop a low-cost edge-compatible system for diabetic retinopathy screening.",
    "confidential_brief": "Detailed sponsor research requirements and internal methodology.",
    "funding": 100000,
    "confidentiality": Confidentiality.INTERNAL.value,
}

DEMO_MILESTONES: list[dict[str, object]] = [
    {
        "title": "Milestone 1: Dataset curation & baseline model",
        "description": "Curate a labelled fundus image dataset and train a baseline DR grading model.",
        "deliverable": "Baseline model card + evaluation report",
        "acceptance_criteria": "Validation AUC >= 0.85 and documented data provenance",
        "reward": 50000,
    },
    {
        "title": "Milestone 2: Edge deployment & field pilot",
        "description": "Quantise the model and run it on a low-cost edge device in a clinic pilot.",
        "deliverable": "Edge device demo + pilot report",
        "acceptance_criteria": "Inference under 2s per image on target hardware + pilot sign-off",
        "reward": 50000,
    },
]

# (user name, membership status). Active members take part in the reward split,
# so the demo split works out to Student A 50% / Student B 30% / Expert 20%.
DEMO_MEMBERSHIP: list[tuple[str, str]] = [
    ("STUDENT-001", MemberStatus.ACTIVE.value),
    ("STUDENT-002", MemberStatus.ACTIVE.value),
    ("EXPERT-001", MemberStatus.ACTIVE.value),
    ("STUDENT-003", MemberStatus.INVITED.value),
]


def seed() -> None:
    Base.metadata.create_all(bind=engine)
    ensure_columns()
    db = SessionLocal()
    try:
        users: dict[str, User] = {}
        for spec in DEMO_USERS:
            existing = db.scalar(select(User).where(User.email == spec["email"]))
            if existing is not None:
                users[spec["name"]] = existing
                continue
            user = User(
                name=spec["name"],
                email=spec["email"],
                password_hash=hash_password(DEMO_PASSWORD),
                role=spec["role"],
                skills=spec["skills"],
                verification_status="VERIFIED",
            )
            db.add(user)
            users[spec["name"]] = user
        db.flush()

        sponsor = users["SPONSOR-001"]
        project = db.scalar(select(Project).where(Project.title == DEMO_PROJECT["title"]))
        if project is None:
            project = Project(sponsor_id=sponsor.id, **DEMO_PROJECT)
            db.add(project)
            db.flush()
            print(f"Created demo project #{project.id}: {project.title}")

            for title_offset, milestone_spec in enumerate(DEMO_MILESTONES):
                db.add(Milestone(project_id=project.id, **milestone_spec))
            print(f"Created {len(DEMO_MILESTONES)} milestones (Rs 50,000 each)")

            for member_name, status in DEMO_MEMBERSHIP:
                member_user = users[member_name]
                already = db.scalar(
                    select(ProjectMember).where(
                        ProjectMember.project_id == project.id,
                        ProjectMember.user_id == member_user.id,
                    )
                )
                if already is None:
                    db.add(
                        ProjectMember(
                            project_id=project.id,
                            user_id=member_user.id,
                            role=member_user.role,
                            status=status,
                        )
                    )
            print(f"Created {len(DEMO_MEMBERSHIP)} project memberships")
        else:
            print(f"Demo project already exists (#{project.id})")
            if project.code is None:
                project.code = "GCU-DEMO-001"
                db.add(project)
                print("Backfilled project code GCU-DEMO-001")

        db.commit()

        print("\nDemo users (password for all: %s):" % DEMO_PASSWORD)
        for spec in DEMO_USERS:
            print(f"  {spec['name']:<14} {spec['email']:<26} {spec['role']}")
        print("\nSeed complete.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
    engine.dispose()
