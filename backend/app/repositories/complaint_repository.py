"""Complaint repository — plain DB access, no business rules."""
from datetime import datetime

from sqlalchemy import case, func
from sqlalchemy.orm import Session, joinedload

from app.models.complaint import Complaint
from app.models.complaint_history import ComplaintHistory
from app.models.enums import ComplaintCategory, ComplaintPriority, ComplaintStatus
from app.models.house import House
from app.models.resident import Resident


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


def list_all(
    db: Session,
    status_filter: ComplaintStatus | None = None,
    priority_filter: ComplaintPriority | None = None,
    category_filter: ComplaintCategory | None = None,
    assigned_admin_id: int | None = None,
    assigned_staff_id: int | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    search: str | None = None,
) -> list[Complaint]:
    """
    Backward-compatible with the original `list_all(db, status_filter)`
    call from Module 6 — every new parameter is optional and defaults to
    None (no filtering), so existing callers keep working unchanged.

    Sorting is priority-first (Critical, High, Normal, Low), then newest
    first within each priority tier — matches the enhancement spec's
    "High and Critical complaints should always appear first."
    """
    query = db.query(Complaint)

    if status_filter is not None:
        query = query.filter(Complaint.status == status_filter)
    if priority_filter is not None:
        query = query.filter(Complaint.priority == priority_filter)
    if category_filter is not None:
        query = query.filter(Complaint.category == category_filter)
    if assigned_admin_id is not None:
        query = query.filter(Complaint.assigned_admin_id == assigned_admin_id)
    if assigned_staff_id is not None:
        query = query.filter(Complaint.assigned_staff_id == assigned_staff_id)
    if date_from is not None:
        query = query.filter(Complaint.created_at >= date_from)
    if date_to is not None:
        query = query.filter(Complaint.created_at <= date_to)

    if search:
        query = query.join(Resident, Complaint.resident_id == Resident.id).join(
            House, Complaint.house_id == House.id
        )
        like = f"%{search}%"
        query = query.filter(
            Complaint.complaint_code.ilike(like)
            | Resident.phone.ilike(like)
            | Resident.full_name.ilike(like)
            | House.house_code.ilike(like)
        )

    priority_order = case(
        (Complaint.priority == ComplaintPriority.CRITICAL, 0),
        (Complaint.priority == ComplaintPriority.HIGH, 1),
        (Complaint.priority == ComplaintPriority.NORMAL, 2),
        (Complaint.priority == ComplaintPriority.LOW, 3),
        else_=4,
    )
    return query.order_by(priority_order, Complaint.created_at.desc()).all()


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


def dashboard_counts(db: Session, admin_id: int | None = None) -> dict[str, int]:
    """Backs the admin dashboard widgets (Section 7 of the enhancement spec)."""
    base = db.query(Complaint)
    open_statuses = [ComplaintStatus.PENDING, ComplaintStatus.ACCEPTED, ComplaintStatus.ASSIGNED, ComplaintStatus.IN_PROGRESS]

    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

    counts = {
        "open": base.filter(Complaint.status.in_(open_statuses)).count(),
        "pending": base.filter(Complaint.status == ComplaintStatus.PENDING).count(),
        "resolved_today": base.filter(
            Complaint.status == ComplaintStatus.RESOLVED, Complaint.updated_at >= today_start
        ).count(),
        "high_priority": base.filter(Complaint.priority == ComplaintPriority.HIGH).count(),
        "critical": base.filter(Complaint.priority == ComplaintPriority.CRITICAL).count(),
    }
    if admin_id is not None:
        counts["assigned_to_me"] = base.filter(Complaint.assigned_admin_id == admin_id).count()
    return counts
