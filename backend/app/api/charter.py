"""Charter endpoints: create, read latest, accept."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db, utcnow
from app.deps import get_current_user, get_project, require_project_edit
from app.models.charter import Charter, CharterAcceptance
from app.models.project import MemberStatus, Project, ProjectMember
from app.models.user import User
from app.schemas.charter import CharterAcceptanceOut, CharterCreate, CharterOut
from app.services.ledger import record_ledger_entry

router = APIRouter(prefix="/api/projects", tags=["charter"])


def _latest_charter(db: Session, project_id: int) -> Charter | None:
    return db.scalar(
        select(Charter)
        .where(Charter.project_id == project_id)
        .order_by(Charter.version.desc())
        .limit(1)
    )


@router.post("/{project_id}/charter", response_model=CharterOut, status_code=status.HTTP_201_CREATED)
def create_charter(
    payload: CharterCreate,
    project: Project = Depends(require_project_edit),
    db: Session = Depends(get_db),
) -> CharterOut:
    """Create a new charter version for the project (sponsor/ADMIN only)."""
    latest = _latest_charter(db, project.id)
    version = (latest.version + 1) if latest is not None else 1
    charter = Charter(project_id=project.id, version=version, **payload.model_dump())
    db.add(charter)
    db.commit()
    db.refresh(charter)
    return CharterOut.model_validate(charter)


@router.get("/{project_id}/charter", response_model=CharterOut)
def get_charter(
    project: Project = Depends(get_project),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CharterOut:
    """Return the latest charter version for the project."""
    charter = _latest_charter(db, project.id)
    if charter is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No charter created yet")
    return CharterOut.model_validate(charter)


@router.post("/{project_id}/charter/approve", response_model=CharterOut)
def approve_charter(
    project: Project = Depends(require_project_edit),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CharterOut:
    """Approve the latest charter. Sponsor or ADMIN only. Makes charter enforceable."""
    charter = _latest_charter(db, project.id)
    if charter is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No charter exists to approve")

    charter.status = "APPROVED"
    charter.approved_by = current_user.id
    charter.approved_at = utcnow()
    db.commit()
    db.refresh(charter)

    record_ledger_entry(
        db,
        project_id=project.id,
        action="CHARTER_APPROVED",
        actor_id=current_user.id,
        actor_name=current_user.name,
        details=f"Charter v{charter.version} verified and approved by sponsor",
    )
    return CharterOut.model_validate(charter)


@router.post("/{project_id}/charter/accept", response_model=CharterAcceptanceOut)
def accept_charter(
    project: Project = Depends(get_project),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CharterAcceptanceOut:
    """Accept the latest charter on behalf of the current user."""
    charter = _latest_charter(db, project.id)
    if charter is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No charter created yet")

    existing = db.scalar(
        select(CharterAcceptance).where(
            CharterAcceptance.charter_id == charter.id,
            CharterAcceptance.user_id == current_user.id,
        )
    )
    if existing is not None:
        return CharterAcceptanceOut.model_validate(existing)

    acceptance = CharterAcceptance(charter_id=charter.id, user_id=current_user.id)
    db.add(acceptance)

    member = db.scalar(
        select(ProjectMember).where(
            ProjectMember.project_id == project.id,
            ProjectMember.user_id == current_user.id,
        )
    )
    if member is not None:
        # Record exactly which charter version this user accepted.
        member.charter_version = charter.version
        # An INVITED candidate only becomes ACTIVE once the charter they
        # accepted is APPROVED (AI cannot approve; sponsor/admin must).
        if member.status == MemberStatus.INVITED.value and charter.status == "APPROVED":
            member.status = MemberStatus.ACTIVE.value
            record_ledger_entry(
                db,
                project_id=project.id,
                action="MEMBER_ACCEPTED",
                actor_id=current_user.id,
                actor_name=current_user.name,
                details=f"{current_user.role} accepted charter v{charter.version} and joined team as ACTIVE member",
            )

    db.commit()
    db.refresh(acceptance)

    record_ledger_entry(
        db,
        project_id=project.id,
        action="CHARTER_ACCEPTED",
        actor_id=current_user.id,
        actor_name=current_user.name,
        details=f"User {current_user.name} accepted charter v{charter.version}",
    )
    return CharterAcceptanceOut.model_validate(acceptance)
