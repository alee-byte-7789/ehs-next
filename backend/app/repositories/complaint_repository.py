"""Complaint repository — plain DB access, no business rules."""
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.models.complaint import Complaint
from app.models.complaint_history import ComplaintHistory
from app.models.enums import ComplaintStatus


def get_by_id(db: Session, complaint_id: int) -> Complaint | None:
    return db.query(Complaint).filter(Complaint.id == complaint_id).first()


def get_by_id_with_history(db: Session, complaint_id: int) -> Complaint | None:
    return (
        db.query(Complaint)
        .options(joinedload(Complaint.history))
        .filter(Complaint.id == complaint_id)
        .first()
    )


def list_for_resident(db: Session, resident_id: int) -> list[Complaint]:
    return (
        db.query(Complaint)
        .filter(Complaint.resident_id == resident_id)
        .order_by(Complaint.created_at.desc())
        .all()
    )


def list_all(db: Session, status_filter: ComplaintStatus | None = None) -> list[Complaint]:
    query = db.query(Complaint)
    if status_filter is not None:
        query = query.filter(Complaint.status == status_filter)
    return query.order_by(Complaint.created_at.desc()).all()


def next_complaint_sequence(db: Session) -> int:
    """Next sequence number for a new complaint_code. Uses a simple count+1
    rather than tenant_sequence's max-based approach, since complaints are
    never deleted through any supported operation in this system — there's
    no gap-reuse risk to guard against here."""
    current_count = db.query(func.count(Complaint.id)).scalar()
    return (current_count or 0) + 1


def has_ever_been_reopened(db: Session, complaint_id: int) -> bool:
    """Determines whether a resident may self-close this complaint (never
    reopened) versus only an admin being allowed to (has been reopened at
    least once in its history) — see complaint_service.py for the rule."""
    return (
        db.query(ComplaintHistory.id)
        .filter(
            ComplaintHistory.complaint_id == complaint_id,
            ComplaintHistory.to_status == ComplaintStatus.REOPENED,
        )
        .first()
        is not None
    )
