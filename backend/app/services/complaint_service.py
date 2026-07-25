"""
Complaint service — the state machine described in PROJECT_ROADMAP.md
Section 7:

    PENDING -> ACCEPTED -> ASSIGNED -> IN_PROGRESS -> RESOLVED
                                                          |
                                +-------------------------+-------------------------+
                                |                                                    |
                        resident: satisfied                              resident: not satisfied
                                |                                                    |
                             CLOSED                                             REOPENED
                                                                                      |
                                                                          admin: assign -> ASSIGNED -> ... -> RESOLVED
                                                                          admin closes only -> CLOSED

Every transition is validated against the complaint's CURRENT status before
being applied — this is enforced here, not just hidden in the UI, so a
malicious or buggy client can't skip steps by calling the API directly
with an unexpected sequence of requests. Every transition also writes a
`ComplaintHistory` row in the same database transaction as the status
change, so history and status can never drift out of sync.

Staff have no login in this system (see app/models/staff.py) — every
transition from ACCEPTED onward is triggered by an admin on staff's
behalf (e.g. after a phone call or in-person update), not by staff
themselves calling the API.
"""
import json

from sqlalchemy.orm import Session

from app.models.complaint import Complaint
from app.models.complaint_history import ComplaintHistory
from app.models.enums import AdminRole, ChangedByType, ComplaintStatus
from app.models.resident import Resident
from app.repositories import complaint_repository, staff_repository
from app.schemas.complaint import ComplaintCreateRequest
from app.services import notification_service
from app.services.errors import InvalidStateError, NotFoundError
from app.services.id_generation import complaint_code as build_complaint_code

_ADMIN_ROLES = (AdminRole.HOUSING_OFFICE, AdminRole.SUPER_ADMIN)


def create_complaint(db: Session, resident: Resident, req: ComplaintCreateRequest) -> Complaint:
    sequence = complaint_repository.next_complaint_sequence(db)
    complaint = Complaint(
        complaint_code=build_complaint_code(sequence),
        resident_id=resident.id,
        house_id=resident.house_id,
        category=req.category,
        subcategory=req.subcategory,
        description=req.description,
        photo_urls=json.dumps(req.photo_urls) if req.photo_urls else None,
        status=ComplaintStatus.PENDING,
    )
    db.add(complaint)
    db.flush()

    _record_history(db, complaint, from_status=None, to_status=ComplaintStatus.PENDING,
                     changed_by_type=ChangedByType.RESIDENT, changed_by_id=resident.id)

    notification_service.notify_admins(
        db, _ADMIN_ROLES,
        title=f"New complaint: {complaint.complaint_code}",
        body=f"{req.subcategory}: {req.description[:120]}",
        type_="complaint_new",
    )

    db.commit()
    db.refresh(complaint)
    return complaint


def get_own_complaint(db: Session, resident: Resident, complaint_id: int) -> Complaint:
    complaint = complaint_repository.get_by_id_with_history(db, complaint_id)
    if not complaint or complaint.resident_id != resident.id:
        raise NotFoundError(f"No complaint with id {complaint_id} for this resident.")
    return complaint


def list_own_complaints(db: Session, resident: Resident) -> list[Complaint]:
    return complaint_repository.list_for_resident(db, resident.id)


def get_complaint_detail(db: Session, complaint_id: int) -> Complaint:
    complaint = complaint_repository.get_by_id_with_history(db, complaint_id)
    if not complaint:
        raise NotFoundError(f"No complaint with id {complaint_id}.")
    return complaint


def list_complaints(db: Session, status_filter: ComplaintStatus | None = None) -> list[Complaint]:
    return complaint_repository.list_all(db, status_filter)


# --- Admin-driven forward transitions ---

def accept(db: Session, complaint_id: int, admin_id: int) -> Complaint:
    complaint = _require_status(db, complaint_id, ComplaintStatus.PENDING)
    return _transition(db, complaint, ComplaintStatus.ACCEPTED, ChangedByType.ADMIN, admin_id)


def assign(db: Session, complaint_id: int, staff_id: int, admin_id: int) -> Complaint:
    complaint = _require_status(db, complaint_id, ComplaintStatus.ACCEPTED, ComplaintStatus.REOPENED)

    staff = staff_repository.get_by_id(db, staff_id)
    if not staff or not staff.is_active:
        raise NotFoundError(f"No active staff member with id {staff_id}.")

    complaint.assigned_staff_id = staff_id
    return _transition(db, complaint, ComplaintStatus.ASSIGNED, ChangedByType.ADMIN, admin_id,
                        note=f"Assigned to {staff.full_name}")


def start_progress(db: Session, complaint_id: int, admin_id: int) -> Complaint:
    complaint = _require_status(db, complaint_id, ComplaintStatus.ASSIGNED)
    return _transition(db, complaint, ComplaintStatus.IN_PROGRESS, ChangedByType.ADMIN, admin_id)


def resolve(db: Session, complaint_id: int, admin_id: int) -> Complaint:
    complaint = _require_status(db, complaint_id, ComplaintStatus.IN_PROGRESS)
    return _transition(db, complaint, ComplaintStatus.RESOLVED, ChangedByType.ADMIN, admin_id)


# --- Resident-driven terminal transitions ---

def close_by_resident(db: Session, resident: Resident, complaint_id: int) -> Complaint:
    complaint = _require_owned_status(db, resident, complaint_id, ComplaintStatus.RESOLVED)

    if complaint_repository.has_ever_been_reopened(db, complaint_id):
        raise InvalidStateError(
            "This complaint was previously reopened — only an admin can close it now."
        )

    complaint.close_count += 1
    complaint.closed_at = _now()
    return _transition(db, complaint, ComplaintStatus.CLOSED, ChangedByType.RESIDENT, resident.id)


def reopen_by_resident(db: Session, resident: Resident, complaint_id: int) -> Complaint:
    complaint = _require_owned_status(db, resident, complaint_id, ComplaintStatus.RESOLVED)
    return _transition(db, complaint, ComplaintStatus.REOPENED, ChangedByType.RESIDENT, resident.id)


# --- Admin-only close (bypasses the "never reopened" restriction) ---

def close_by_admin(db: Session, complaint_id: int, admin_id: int) -> Complaint:
    complaint = _require_status(db, complaint_id, ComplaintStatus.RESOLVED)
    complaint.closed_at = _now()
    return _transition(db, complaint, ComplaintStatus.CLOSED, ChangedByType.ADMIN, admin_id)


# --- Internal helpers ---

def _now():
    from datetime import datetime, timezone
    return datetime.now(timezone.utc)


def _require_status(db: Session, complaint_id: int, *allowed: ComplaintStatus) -> Complaint:
    complaint = complaint_repository.get_by_id(db, complaint_id)
    if not complaint:
        raise NotFoundError(f"No complaint with id {complaint_id}.")
    if complaint.status not in allowed:
        allowed_names = ", ".join(s.value for s in allowed)
        raise InvalidStateError(
            f"Complaint {complaint_id} is '{complaint.status.value}', expected one of: {allowed_names}."
        )
    return complaint


def _require_owned_status(db: Session, resident: Resident, complaint_id: int, *allowed: ComplaintStatus) -> Complaint:
    complaint = complaint_repository.get_by_id(db, complaint_id)
    if not complaint or complaint.resident_id != resident.id:
        raise NotFoundError(f"No complaint with id {complaint_id} for this resident.")
    if complaint.status not in allowed:
        allowed_names = ", ".join(s.value for s in allowed)
        raise InvalidStateError(
            f"Complaint {complaint_id} is '{complaint.status.value}', expected one of: {allowed_names}."
        )
    return complaint


def _transition(
    db: Session,
    complaint: Complaint,
    to_status: ComplaintStatus,
    changed_by_type: ChangedByType,
    changed_by_id: int | None,
    note: str | None = None,
) -> Complaint:
    from_status = complaint.status
    complaint.status = to_status
    _record_history(db, complaint, from_status, to_status, changed_by_type, changed_by_id, note)
    _notify_for_transition(db, complaint, to_status, changed_by_type)
    db.commit()
    db.refresh(complaint)
    return complaint


def _notify_for_transition(
    db: Session, complaint: Complaint, to_status: ComplaintStatus, changed_by_type: ChangedByType
) -> None:
    """Resident hears about admin-driven progress on their own complaint;
    admins hear when a resident reopens one — each side only gets notified
    about the other side's actions, not their own."""
    status_label = to_status.value.replace("_", " ")

    if changed_by_type == ChangedByType.ADMIN:
        notification_service.notify_resident(
            db, complaint.resident_id,
            title=f"Complaint {complaint.complaint_code} updated",
            body=f"Your complaint is now '{status_label}'.",
            type_="complaint_status",
        )
    elif to_status == ComplaintStatus.REOPENED:
        notification_service.notify_admins(
            db, _ADMIN_ROLES,
            title=f"Complaint {complaint.complaint_code} reopened",
            body="A resident was not satisfied with the resolution and reopened this complaint.",
            type_="complaint_reopened",
        )


def _record_history(
    db: Session,
    complaint: Complaint,
    from_status: ComplaintStatus | None,
    to_status: ComplaintStatus,
    changed_by_type: ChangedByType,
    changed_by_id: int | None,
    note: str | None = None,
) -> None:
    db.add(ComplaintHistory(
        complaint_id=complaint.id,
        from_status=from_status,
        to_status=to_status,
        changed_by_type=changed_by_type,
        changed_by_id=changed_by_id,
        note=note,
    ))
