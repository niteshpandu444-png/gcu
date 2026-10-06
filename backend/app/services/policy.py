"""Access policies.

``can_access_confidential_brief`` is the single reusable policy function used
everywhere the confidential brief is returned. Keep all confidential-brief
logic here so it can grow without touching routers.

Charter gating (P0 Task 2)
--------------------------
Once a project has a charter, that charter becomes the gate:

* the current (latest) charter must be APPROVED, and
* the user must have accepted that exact charter version.

Before any charter exists there is nothing to enforce yet, so ACTIVE
membership alone still governs (keeps the seeded demo and existing regression
tests coherent). ADMIN and the project sponsor always have access, and a
PUBLIC project's brief is public by definition. Rejected / invited-only
candidates never pass the membership check, so they never see the brief.
"""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.charter import Charter, CharterAcceptance
from app.models.project import MemberStatus, Project, ProjectMember
from app.models.user import Role, User

TEAM_MIN_EXPERTS = 1
TEAM_MIN_STUDENTS = 2


def latest_charter(db: Session, project_id: int) -> Charter | None:
    """The current charter version for a project (or None)."""
    return db.scalar(
        select(Charter)
        .where(Charter.project_id == project_id)
        .order_by(Charter.version.desc())
        .limit(1)
    )


def has_accepted_charter(db: Session, user: User, charter: Charter) -> bool:
    """True when the user accepted this exact charter version."""
    return (
        db.scalar(
            select(CharterAcceptance.id).where(
                CharterAcceptance.charter_id == charter.id,
                CharterAcceptance.user_id == user.id,
            )
        )
        is not None
    )


def charter_gate_allows(db: Session, user: User, project: Project) -> bool:
    """True when the user satisfies the current charter gate.

    No charter yet -> gate not active (membership alone governs).
    Charter exists -> it must be APPROVED and accepted by this user.
    """
    charter = latest_charter(db, project.id)
    if charter is None:
        return True
    if charter.status != "APPROVED":
        return False
    return has_accepted_charter(db, user, charter)


def can_access_confidential_brief(
    db: Session,
    user: User,
    project: Project,
    *,
    is_member: bool = False,
) -> bool:
    """Return True when ``user`` may see ``project.confidential_brief``.

    Rules:

    * ``ADMIN`` always can.
    * The project's sponsor always can.
    * ``PUBLIC`` projects expose the brief by definition.
    * Otherwise: ACTIVE membership (``is_member``) AND the charter gate
      (current charter APPROVED + accepted by this user).
    """
    if user.role == Role.ADMIN.value:
        return True
    if project.sponsor_id == user.id:
        return True
    if project.confidentiality == "PUBLIC":
        return True
    if not is_member:
        return False
    return charter_gate_allows(db, user, project)


def project_role_label(user: User) -> str:
    """Human readable role label for API responses."""
    return user.role


def is_active_member(db: Session, user: User, project_id: int) -> bool:
    """True when the user has an ACTIVE membership on the project."""
    return (
        db.scalar(
            select(ProjectMember.id).where(
                ProjectMember.project_id == project_id,
                ProjectMember.user_id == user.id,
                ProjectMember.status == MemberStatus.ACTIVE.value,
            )
        )
        is not None
    )


def can_use_project_agent(db: Session, user: User, project: Project) -> bool:
    """Gate for AI endpoints: ADMIN, the sponsor, or an ACTIVE member that
    satisfies the charter gate (same concept as confidential access)."""
    if user.role == Role.ADMIN.value:
        return True
    if project.sponsor_id == user.id:
        return True
    if not is_active_member(db, user, project.id):
        return False
    return charter_gate_allows(db, user, project)


def team_state(db: Session, project_id: int) -> str:
    """TEAM_FORMED once >=1 ACTIVE expert and >=2 ACTIVE students exist."""
    rows = db.execute(
        select(ProjectMember.role, ProjectMember.status).where(
            ProjectMember.project_id == project_id,
            ProjectMember.status == MemberStatus.ACTIVE.value,
        )
    ).all()
    experts = sum(1 for role, _ in rows if role == Role.EXPERT.value)
    students = sum(1 for role, _ in rows if role == Role.STUDENT.value)
    if experts >= TEAM_MIN_EXPERTS and students >= TEAM_MIN_STUDENTS:
        return "TEAM_FORMED"
    return "FORMING"
