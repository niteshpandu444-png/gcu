"""Ledger endpoints: audit log and chain verification."""

from datetime import datetime
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user, get_project
from app.models.project import Project
from app.models.user import User
from app.services.ledger import get_project_ledger, verify_project_ledger

router = APIRouter(prefix="/api/projects", tags=["ledger"])


class LedgerEntryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    entry_id: int
    project_id: int
    actor_id: int | None
    actor_name: str
    actor_type: str
    action: str
    artifact_id: str | None
    timestamp: datetime
    previous_hash: str
    current_hash: str
    details: str


class LedgerVerifyOut(BaseModel):
    valid: bool
    entries_checked: int = 0
    broken_at_entry: int | None = None
    reason: str | None = None
    details: str | None = None
    latest_hash: str | None = None


@router.get("/{project_id}/ledger", response_model=list[LedgerEntryOut])
def list_ledger(
    project: Project = Depends(get_project),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[LedgerEntryOut]:
    """Retrieve the tamper-evident ledger entries for the project in chronological order."""
    entries = get_project_ledger(db, project.id)
    return [LedgerEntryOut.model_validate(e) for e in entries]


@router.get("/{project_id}/ledger/verify", response_model=LedgerVerifyOut)
def verify_ledger(
    project: Project = Depends(get_project),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tamper: bool = Query(False, description="Simulate a tampered entry for demo testing"),
) -> LedgerVerifyOut:
    """Verify cryptographic integrity of the SHA-256 hash chain."""
    result = verify_project_ledger(db, project.id, simulate_tamper=tamper)
    return LedgerVerifyOut(**result)
