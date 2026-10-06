"""Project endpoints: create, list, detail (with confidential-brief policy)."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user, get_project, require_roles
from app.models.project import MemberStatus, Project, ProjectMember
from app.models.user import Role, User
from app.schemas.project import ProjectCreate, ProjectOut
from app.services.policy import can_access_confidential_brief

router = APIRouter(prefix="/api/projects", tags=["projects"])


def _active_member_project_ids(db: Session, user: User) -> set[int]:
    """Project ids where the user has an ACTIVE membership."""
    rows = db.scalars(
        select(ProjectMember.project_id).where(
            ProjectMember.user_id == user.id,
            ProjectMember.status == MemberStatus.ACTIVE.value,
        )
    ).all()
    return set(rows)


def _to_out(project: Project, user: User, is_member: bool) -> ProjectOut:
    allowed = can_access_confidential_brief(user, project, is_member=is_member)
    return ProjectOut(
        id=project.id,
        sponsor_id=project.sponsor_id,
        title=project.title,
        public_summary=project.public_summary,
        confidential_brief=project.confidential_brief if allowed else None,
        funding=project.funding,
        confidentiality=project.confidentiality,
        status=project.status,
        created_at=project.created_at,
        can_view_confidential_brief=allowed,
    )


@router.post("", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
def create_project(
    payload: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(Role.SPONSOR)),
) -> ProjectOut:
    """Create a project. Only SPONSOR (or ADMIN) may create projects."""
    project = Project(
        sponsor_id=current_user.id,
        title=payload.title,
        public_summary=payload.public_summary,
        confidential_brief=payload.confidential_brief,
        funding=payload.funding,
        confidentiality=payload.confidentiality.value,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return _to_out(project, current_user, is_member=True)


@router.get("", response_model=list[ProjectOut])
def list_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ProjectOut]:
    """List projects (public information only unless the policy allows the brief)."""
    projects = db.scalars(select(Project).order_by(Project.id.desc())).all()
    member_ids = _active_member_project_ids(db, current_user)
    return [_to_out(p, current_user, is_member=p.id in member_ids) for p in projects]


@router.get("/{project_id}", response_model=ProjectOut)
def get_project_detail(
    project: Project = Depends(get_project),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ProjectOut:
    """Project detail. The confidential brief is only included when
    ``can_access_confidential_brief`` allows it."""
    is_member = project.id in _active_member_project_ids(db, current_user)
    return _to_out(project, current_user, is_member=is_member)
