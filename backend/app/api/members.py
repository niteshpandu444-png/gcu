"""Project membership endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user, get_project, require_project_edit
from app.models.project import Project, ProjectMember
from app.models.user import Role, User
from app.schemas.project import MemberAdd, MemberOut

router = APIRouter(prefix="/api/projects", tags=["members"])


def _to_out(member: ProjectMember, user: User | None) -> MemberOut:
    return MemberOut(
        id=member.id,
        project_id=member.project_id,
        user_id=member.user_id,
        role=member.role,
        status=member.status,
        joined_at=member.joined_at,
        user_name=user.name if user else "",
        user_email=user.email if user else "",
        skills=user.skills if user else "",
    )


@router.post(
    "/{project_id}/members",
    response_model=MemberOut,
    status_code=status.HTTP_201_CREATED,
)
def add_member(
    payload: MemberAdd,
    project: Project = Depends(require_project_edit),
    db: Session = Depends(get_db),
) -> MemberOut:
    """Add a member to a project. Sponsor (or ADMIN) only — used for demo setup."""
    user = db.get(User, payload.user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    existing = db.scalar(
        select(ProjectMember).where(
            ProjectMember.project_id == project.id,
            ProjectMember.user_id == payload.user_id,
        )
    )
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User is already a member")

    role = payload.role.value if payload.role else user.role
    member = ProjectMember(
        project_id=project.id,
        user_id=payload.user_id,
        role=role,
        status=payload.status.value,
    )
    db.add(member)
    db.commit()
    db.refresh(member)
    return _to_out(member, user)


@router.get("/{project_id}/members", response_model=list[MemberOut])
def list_members(
    project: Project = Depends(get_project),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[MemberOut]:
    """List all members of a project."""
    rows = db.execute(
        select(ProjectMember, User)
        .join(User, User.id == ProjectMember.user_id)
        .where(ProjectMember.project_id == project.id)
        .order_by(ProjectMember.id)
    ).all()
    return [_to_out(member, user) for member, user in rows]
