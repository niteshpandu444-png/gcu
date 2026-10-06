"""Project membership endpoints: add, list, invite, accept, reject."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user, get_project, require_project_edit
from app.models.charter import Charter, CharterAcceptance
from app.models.project import MemberStatus, Project, ProjectMember
from app.models.user import Role, User
from app.schemas.project import MemberAdd, MemberOut
from app.services.ledger import record_ledger_entry
from app.services.policy import latest_charter

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
        charter_version=member.charter_version,
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


def _get_member(db: Session, project: Project, user_id: int) -> tuple[ProjectMember, User]:
    member = db.scalar(
        select(ProjectMember).where(
            ProjectMember.project_id == project.id,
            ProjectMember.user_id == user_id,
        )
    )
    user = db.get(User, user_id)
    if member is None or user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate is not a project member")
    return member, user


def _require_approved_charter(db: Session, project: Project) -> Charter:
    charter = latest_charter(db, project.id)
    if charter is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No charter exists yet — generate and approve the charter first",
        )
    if charter.status != "APPROVED":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Charter must be approved by the sponsor before invitations",
        )
    return charter


@router.post(
    "/{project_id}/members/{user_id}/invite",
    response_model=MemberOut,
    status_code=status.HTTP_201_CREATED,
)
def invite_member(
    user_id: int,
    project: Project = Depends(require_project_edit),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MemberOut:
    """Sponsor (or ADMIN) invites a candidate. Requires an APPROVED charter.

    Creates (or re-opens) the membership as INVITED. An invitation never
    grants confidential access — only ACCEPT does, and only after the
    candidate accepts the approved charter.
    """
    _require_approved_charter(db, project)

    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if user.role not in (Role.EXPERT.value, Role.STUDENT.value):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only EXPERT or STUDENT candidates can be invited")
    if user.id == project.sponsor_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="The sponsor cannot be invited as a candidate")

    member = db.scalar(
        select(ProjectMember).where(
            ProjectMember.project_id == project.id,
            ProjectMember.user_id == user_id,
        )
    )
    if member is None:
        member = ProjectMember(
            project_id=project.id,
            user_id=user_id,
            role=user.role,
            status=MemberStatus.INVITED.value,
            charter_version=None,
        )
        db.add(member)
    elif member.status in (MemberStatus.INVITED.value, MemberStatus.ACTIVE.value):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Candidate is already {member.status}")
    else:
        # REJECTED / LEFT / REVOKED -> re-invite from scratch.
        member.status = MemberStatus.INVITED.value
        member.charter_version = None

    db.commit()
    db.refresh(member)
    return _to_out(member, user)


@router.post(
    "/{project_id}/members/{user_id}/accept",
    response_model=MemberOut,
    status_code=status.HTTP_200_OK,
)
def accept_invitation(
    user_id: int,
    project: Project = Depends(get_project),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MemberOut:
    """The candidate accepts their own invitation (self only).

    Preconditions: the charter exists and is APPROVED. Acceptance records the
    accepted charter version, grants the permitted confidential access, and
    only then flips membership to ACTIVE.
    """
    if current_user.id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only accept your own invitation")

    member, user = _get_member(db, project, user_id)
    if member.status == MemberStatus.ACTIVE.value:
        return _to_out(member, user)  # idempotent
    if member.status != MemberStatus.INVITED.value:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Invitation is {member.status}, not INVITED")

    charter = _require_approved_charter(db, project)

    # Record acceptance of this exact charter version (idempotent).
    existing = db.scalar(
        select(CharterAcceptance).where(
            CharterAcceptance.charter_id == charter.id,
            CharterAcceptance.user_id == current_user.id,
        )
    )
    if existing is None:
        db.add(CharterAcceptance(charter_id=charter.id, user_id=current_user.id))

    member.status = MemberStatus.ACTIVE.value
    member.charter_version = charter.version
    db.commit()
    db.refresh(member)

    record_ledger_entry(
        db,
        project_id=project.id,
        action="MEMBER_ACCEPTED",
        actor_id=current_user.id,
        actor_name=current_user.name,
        details=f"{user.role} accepted invitation and charter v{charter.version} -> ACTIVE",
    )
    record_ledger_entry(
        db,
        project_id=project.id,
        action="CHARTER_ACCEPTED",
        actor_id=current_user.id,
        actor_name=current_user.name,
        details=f"User {current_user.name} accepted charter v{charter.version}",
    )
    db.refresh(member)
    return _to_out(member, user)


@router.post(
    "/{project_id}/members/{user_id}/reject",
    response_model=MemberOut,
    status_code=status.HTTP_200_OK,
)
def reject_invitation(
    user_id: int,
    project: Project = Depends(get_project),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MemberOut:
    """The candidate rejects their own invitation (self only).

    Rejection NEVER grants confidential access and never activates the
    membership; it can be re-invited later.
    """
    if current_user.id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only reject your own invitation")

    member, user = _get_member(db, project, user_id)
    if member.status == MemberStatus.REJECTED.value:
        return _to_out(member, user)  # idempotent
    if member.status not in (MemberStatus.INVITED.value,):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Invitation is {member.status}, cannot reject")

    member.status = MemberStatus.REJECTED.value
    member.charter_version = None
    db.commit()
    db.refresh(member)
    return _to_out(member, user)
