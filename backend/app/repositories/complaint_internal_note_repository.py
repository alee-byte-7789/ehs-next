"""Complaint internal notes repository — plain DB access."""
from sqlalchemy.orm import Session

from app.models.complaint_internal_note import ComplaintInternalNote


def create(db: Session, complaint_id: int, admin_id: int, note: str) -> ComplaintInternalNote:
    row = ComplaintInternalNote(complaint_id=complaint_id, admin_id=admin_id, note=note)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def list_for_complaint(db: Session, complaint_id: int) -> list[ComplaintInternalNote]:
    return (
        db.query(ComplaintInternalNote)
        .filter(ComplaintInternalNote.complaint_id == complaint_id)
        .order_by(ComplaintInternalNote.created_at)
        .all()
    )
