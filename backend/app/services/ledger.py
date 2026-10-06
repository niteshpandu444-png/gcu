"""Tamper-evident contribution ledger service.

Implements a cryptographic SHA-256 hash chain over critical project lifecycle
events (PROJECT_CREATED, CHARTER_APPROVED, CHARTER_ACCEPTED, MEMBER_ACCEPTED,
AI_RESEARCH_QUERY, ARTIFACT_SUBMITTED, REVIEW_APPROVED, ESCROW_RELEASED, PAYOUT_CREATED).

Formula:
    current_hash = SHA256(serialized_entry + previous_hash)

Verification recalculates each link in the chain and detects historical tampering.
"""

import hashlib
import json
from datetime import datetime
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import utcnow
from app.models.ledger import LedgerEntry

GENESIS_HASH = "0" * 64


def serialize_entry_data(
    entry_id: int,
    project_id: int,
    actor_id: int | None,
    actor_type: str,
    action: str,
    artifact_id: str | None,
    timestamp_str: str,
    details: str = "",
) -> str:
    """Create a canonical deterministic JSON string of the entry data."""
    payload = {
        "action": action,
        "actor_id": actor_id,
        "actor_type": actor_type,
        "artifact_id": artifact_id or "",
        "details": details,
        "entry_id": entry_id,
        "project_id": project_id,
        "timestamp": timestamp_str,
    }
    return json.dumps(payload, sort_keys=True, separators=(",", ":"))


def compute_hash(serialized_entry: str, previous_hash: str) -> str:
    """SHA-256(serialized_entry + previous_hash)"""
    hasher = hashlib.sha256()
    hasher.update(serialized_entry.encode("utf-8"))
    hasher.update(previous_hash.encode("utf-8"))
    return hasher.hexdigest()


def record_ledger_entry(
    db: Session,
    *,
    project_id: int,
    action: str,
    actor_id: int | None = None,
    actor_type: str = "HUMAN",
    actor_name: str = "",
    artifact_id: str | None = None,
    details: str = "",
) -> LedgerEntry:
    """Append a new tamper-evident event entry to the project's hash chain."""
    last_entry = db.scalar(
        select(LedgerEntry)
        .where(LedgerEntry.project_id == project_id)
        .order_by(LedgerEntry.entry_id.desc())
        .limit(1)
    )

    if last_entry is not None:
        next_entry_id = last_entry.entry_id + 1
        previous_hash = last_entry.current_hash
    else:
        next_entry_id = 1
        previous_hash = GENESIS_HASH

    ts = utcnow()
    ts_str = ts.isoformat()
    serialized = serialize_entry_data(
        entry_id=next_entry_id,
        project_id=project_id,
        actor_id=actor_id,
        actor_type=actor_type,
        action=action,
        artifact_id=artifact_id,
        timestamp_str=ts_str,
        details=details,
    )
    current_hash = compute_hash(serialized, previous_hash)

    entry = LedgerEntry(
        entry_id=next_entry_id,
        project_id=project_id,
        actor_id=actor_id,
        actor_name=actor_name,
        actor_type=actor_type,
        action=action,
        artifact_id=artifact_id,
        timestamp=ts,
        previous_hash=previous_hash,
        current_hash=current_hash,
        details=details,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def get_project_ledger(db: Session, project_id: int) -> list[LedgerEntry]:
    """Return all ledger entries for a project ordered by entry_id asc."""
    return db.scalars(
        select(LedgerEntry)
        .where(LedgerEntry.project_id == project_id)
        .order_by(LedgerEntry.entry_id.asc())
    ).all()


def verify_project_ledger(
    db: Session,
    project_id: int,
    simulate_tamper: bool = False,
) -> dict:
    """Verify cryptographic integrity of the project's ledger hash chain."""
    entries = get_project_ledger(db, project_id)
    if not entries:
        return {"valid": True, "entries_checked": 0, "message": "Ledger is empty"}

    expected_prev = GENESIS_HASH
    for i, entry in enumerate(entries):
        # Simulate tampering on the second entry if requested
        if simulate_tamper and i == min(1, len(entries) - 1):
            return {
                "valid": False,
                "broken_at_entry": entry.entry_id,
                "reason": "Hash mismatch: historical payload does not match chained SHA-256 digest",
                "details": f"Entry #{entry.entry_id} hash verification failed",
            }

        if entry.previous_hash != expected_prev:
            return {
                "valid": False,
                "broken_at_entry": entry.entry_id,
                "reason": "Previous hash link broken",
                "details": f"Expected previous hash {expected_prev[:12]}... but got {entry.previous_hash[:12]}...",
            }

        ts_str = entry.timestamp.isoformat()
        serialized = serialize_entry_data(
            entry_id=entry.entry_id,
            project_id=entry.project_id,
            actor_id=entry.actor_id,
            actor_type=entry.actor_type,
            action=entry.action,
            artifact_id=entry.artifact_id,
            timestamp_str=ts_str,
            details=entry.details,
        )
        recalculated = compute_hash(serialized, entry.previous_hash)
        if recalculated != entry.current_hash:
            return {
                "valid": False,
                "broken_at_entry": entry.entry_id,
                "reason": "Hash mismatch",
                "details": f"Computed {recalculated[:12]}... != stored {entry.current_hash[:12]}...",
            }

        expected_prev = entry.current_hash

    return {
        "valid": True,
        "entries_checked": len(entries),
        "latest_hash": expected_prev,
    }
