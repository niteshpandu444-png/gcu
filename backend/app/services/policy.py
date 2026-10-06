"""Access policies.

``can_access_confidential_brief`` is the single reusable policy function used
everywhere the confidential brief is returned. Keep all confidential-brief
logic here so it can grow without touching routers.
"""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.project import MemberStatus, Project, ProjectMember
from app.models.user import Role, User


def can_access_confidential_brief(user: User, project: Project, *, is_member: bool = False) -> bool:
    """Return True when ``user`` may see ``project.confidential_brief``.

    Simplified hackathon logic:

    * ``ADMIN`` always can.
    * The project's sponsor always can.
    * ACTIVE project members can.
    * Everyone else cannot.

    Designed to be extended later with:

    * project membership checks (pass ``is_member=True`` from the router,
      usually ``is_active_member(...)``)
    * charter acceptance (once the team signed the charter)
    * sensitivity levels (``project.confidentiality``: PUBLIC/INTERNAL/HIGH)
    """
    if user.role == Role.ADMIN.value:
        return True
    if project.sponsor_id == user.id:
        return True
    if project.confidentiality == "PUBLIC":
        return True
    return is_member


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
    """Gate for AI endpoints: ADMIN, the sponsor, or an ACTIVE member.

    Extend later with charter acceptance or per-agent permissions — keep
    every AI access decision here so routers stay thin.
    """
    if user.role == Role.ADMIN.value:
        return True
    if project.sponsor_id == user.id:
        return True
    return is_active_member(db, user, project.id)
