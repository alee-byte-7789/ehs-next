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
from app.models.enums import AdminRole, ChangedByType, ComplaintCategory, ComplaintPriority, ComplaintStatus
from app.models.resident import Resident
from app.repositories import (
    admin_repository,
    audit_log_repository,
    complaint_internal_note_repository,
    complaint_repository,
    staff_repository,
)
from app.schemas.complaint import ComplaintCreateRequest
from app.services import email_templates, notification_service
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
        link=f"/complaints/{complaint.id}",
    )

    leadership_subject, leadership_html = email_templates.new_complaint_email(
        complaint_code=complaint.complaint_code,
        resident_name=resident.full_name,
        house_code=complaint.house_code,
        category=req.category.value,
        subcategory=req.subcategory,
        priority=complaint.priority.value,
        description=req.description,
    )
    notification_service.notify_leadership_by_email(leadership_subject, leadership_html)

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


def list_complaints(
    db: Session,
    status_filter: ComplaintStatus | None = None,
    priority_filter: ComplaintPriority | None = None,
    category_filter: ComplaintCategory | None = None,
    assigned_admin_id: int | None = None,
    assigned_staff_id: int | None = None,
    search: str | None = None,
    date_from=None,
    date_to=None,
) -> list[Complaint]:
    return complaint_repository.list_all(
        db,
        status_filter=status_filter,
        priority_filter=priority_filter,
        category_filter=category_filter,
        assigned_admin_id=assigned_admin_id,
        assigned_staff_id=assigned_staff_id,
        search=search,
        date_from=date_from,
        date_to=date_to,
    )


def dashboard_counts(db: Session, admin_id: int | None = None) -> dict[str, int]:
    return complaint_repository.dashboard_counts(db, admin_id)


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
    result = _transition(db, complaint, ComplaintStatus.ASSIGNED, ChangedByType.ADMIN, admin_id,
                          note=f"Assigned to {staff.full_name}")

    subject, html = email_templates.complaint_assigned_email(
        complaint_code=complaint.complaint_code,
        assigned_department=staff.category.value,
        status=ComplaintStatus.ASSIGNED.value,
    )
    notification_service.notify_resident(
        db, complaint.resident_id,
        title=f"Complaint {complaint.complaint_code} assigned",
        body=f"Assigned to {staff.full_name} ({staff.category.value}).",
        type_="complaint_assigned",
        link=f"/complaints/{complaint.id}",
        email_content=(subject, html),
    )
    db.commit()  # notify_resident's notification insert is flushed, not committed — _transition() already committed before this ran
    return result


def start_progress(db: Session, complaint_id: int, admin_id: int) -> Complaint:
    complaint = _require_status(db, complaint_id, ComplaintStatus.ASSIGNED)
    return _transition(db, complaint, ComplaintStatus.IN_PROGRESS, ChangedByType.ADMIN, admin_id)


def resolve(db: Session, complaint_id: int, admin_id: int) -> Complaint:
    """Staff assignment is NOT mandatory before resolving — an admin who
    reviews a complaint and finds it already fixed (or trivial) can jump
    straight from `accepted` to `resolved` without ever assigning staff.
    `assigned`/`in_progress` still work too, for the normal full pipeline."""
    complaint = _require_status(
        db, complaint_id, ComplaintStatus.ACCEPTED, ComplaintStatus.ASSIGNED, ComplaintStatus.IN_PROGRESS
    )
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


def close_by_resident_early(db: Session, resident: Resident, complaint_id: int, reason: str) -> Complaint:
    """Enhancement spec: a resident who created a complaint that turns out
    to already be resolved (e.g. someone else fixed it) before any admin
    has even accepted it, can close it themselves directly from PENDING —
    distinct from the normal RESOLVED-only `close_by_resident` above. Once
    an admin accepts (or does anything further), this path is gone."""
    complaint = _require_owned_status(db, resident, complaint_id, ComplaintStatus.PENDING)

    complaint.closed_by_resident_early = True
    complaint.early_close_reason = reason
    complaint.closed_at = _now()
    complaint.close_count += 1
    return _transition(
        db, complaint, ComplaintStatus.CLOSED, ChangedByType.RESIDENT, resident.id,
        note=f"Closed by resident before admin review. Reason: {reason}",
    )


def reopen_by_resident(db: Session, resident: Resident, complaint_id: int) -> Complaint:
    """Works from RESOLVED (the original "not satisfied" flow) or from
    CLOSED (the issue recurred after being closed) — either way, once
    reopened, `has_ever_been_reopened` already makes `close_by_resident`
    refuse a future self-close, so the "admin-only close after reopen"
    rule falls out of existing infrastructure with no extra work needed."""
    complaint = _require_owned_status(db, resident, complaint_id, ComplaintStatus.RESOLVED, ComplaintStatus.CLOSED)
    return _transition(db, complaint, ComplaintStatus.REOPENED, ChangedByType.RESIDENT, resident.id)


# --- Admin-only close (bypasses the "never reopened" restriction) ---

def close_by_admin(db: Session, complaint_id: int, admin_id: int) -> Complaint:
    """Also works directly from `accepted` — an admin who reviews a
    complaint and finds it's a non-issue (or already resolved by someone
    else) can close it in one step, without a mandatory resolve step first."""
    complaint = _require_status(db, complaint_id, ComplaintStatus.ACCEPTED, ComplaintStatus.RESOLVED)
    complaint.closed_at = _now()
    return _transition(db, complaint, ComplaintStatus.CLOSED, ChangedByType.ADMIN, admin_id)


# --- Enhancement spec: reassignment, department routing, priority, notes ---

def reassign_staff(db: Session, complaint_id: int, new_staff_id: int, admin_id: int) -> Complaint:
    """Unlike `assign` (which only works from ACCEPTED/REOPENED, i.e. the
    FIRST assignment), this changes WHO is assigned on a complaint that's
    already ASSIGNED or IN_PROGRESS — no status change, just a staff swap
    with an audit trail."""
    complaint = _require_status(db, complaint_id, ComplaintStatus.ASSIGNED, ComplaintStatus.IN_PROGRESS)

    staff = staff_repository.get_by_id(db, new_staff_id)
    if not staff or not staff.is_active:
        raise NotFoundError(f"No active staff member with id {new_staff_id}.")

    old_staff_id = complaint.assigned_staff_id
    complaint.assigned_staff_id = new_staff_id
    _record_history(
        db, complaint, from_status=complaint.status, to_status=complaint.status,
        changed_by_type=ChangedByType.ADMIN, changed_by_id=admin_id,
        note=f"Reassigned from staff #{old_staff_id} to {staff.full_name}",
    )
    audit_log_repository.log(
        db, admin_id, "reassign_staff", "complaint", complaint_id,
        details=f"staff {old_staff_id} -> {new_staff_id}",
    )
    notification_service.notify_resident(
        db, complaint.resident_id,
        title=f"Complaint {complaint.complaint_code} reassigned",
        body=f"Now assigned to {staff.full_name}.",
        type_="complaint_reassigned",
        link=f"/complaints/{complaint.id}",
    )
    db.commit()
    db.refresh(complaint)
    return complaint


def assign_department(db: Session, complaint_id: int, target_admin_id: int, acting_admin_id: int) -> Complaint:
    """Super Admin routes a complaint to a specific department admin
    (Housing Office / IT / Maintenance) — separate from staff assignment,
    see Complaint.assigned_admin_id's docstring."""
    complaint = complaint_repository.get_by_id(db, complaint_id)
    if not complaint:
        raise NotFoundError(f"No complaint with id {complaint_id}.")

    target_admin = admin_repository.get_by_id(db, target_admin_id)
    if not target_admin:
        raise NotFoundError(f"No admin with id {target_admin_id}.")

    old_admin_id = complaint.assigned_admin_id
    complaint.assigned_admin_id = target_admin_id
    _record_history(
        db, complaint, from_status=complaint.status, to_status=complaint.status,
        changed_by_type=ChangedByType.ADMIN, changed_by_id=acting_admin_id,
        note=f"Routed to {target_admin.full_name} ({target_admin.role.value})",
    )
    notification_service.notify_admins(
        db, (target_admin.role,),
        title=f"Complaint {complaint.complaint_code} assigned to your department",
        body=complaint.subcategory,
        type_="complaint_department_assigned",
        link=f"/complaints/{complaint.id}",
    )
    audit_log_repository.log(
        db, acting_admin_id, "assign_department", "complaint", complaint_id,
        details=f"admin {old_admin_id} -> {target_admin_id}",
    )
    db.commit()
    db.refresh(complaint)
    return complaint


def escalate(db: Session, complaint_id: int, admin_id: int) -> Complaint:
    """Bumps priority one level up (Normal -> High -> Critical; Low -> Normal),
    per the enhancement spec's "Escalate Complaint" admin action."""
    complaint = complaint_repository.get_by_id(db, complaint_id)
    if not complaint:
        raise NotFoundError(f"No complaint with id {complaint_id}.")

    order = [ComplaintPriority.LOW, ComplaintPriority.NORMAL, ComplaintPriority.HIGH, ComplaintPriority.CRITICAL]
    current_index = order.index(complaint.priority)
    new_priority = order[min(current_index + 1, len(order) - 1)]

    return set_priority(db, complaint_id, new_priority, admin_id, _complaint=complaint)


def set_priority(
    db: Session, complaint_id: int, priority: ComplaintPriority, admin_id: int, _complaint: Complaint | None = None
) -> Complaint:
    complaint = _complaint or complaint_repository.get_by_id(db, complaint_id)
    if not complaint:
        raise NotFoundError(f"No complaint with id {complaint_id}.")

    old_priority = complaint.priority
    complaint.priority = priority
    _record_history(
        db, complaint, from_status=complaint.status, to_status=complaint.status,
        changed_by_type=ChangedByType.ADMIN, changed_by_id=admin_id,
        note=f"Priority changed: {old_priority.value} -> {priority.value}",
    )

    if complaint.assigned_admin_id:
        # Spec: "the assigned administrator receives" a notification on
        # every priority change — not just when it reaches High/Critical.
        notification_service.notify_admin_by_id(
            db, complaint.assigned_admin_id,
            title=f"Priority changed: {complaint.complaint_code}",
            body=f"{old_priority.value.title()} -> {priority.value.title()}",
            type_="complaint_priority",
            link=f"/complaints/{complaint.id}",
        )
    elif priority in (ComplaintPriority.HIGH, ComplaintPriority.CRITICAL):
        # No one specifically assigned yet — broadcast so a High/Critical
        # change is never silent, per the spec's separate
        # "High/Critical Complaint" notification trigger.
        notification_service.notify_admins(
            db, _ADMIN_ROLES,
            title=f"{priority.value.upper()} priority: {complaint.complaint_code}",
            body=complaint.subcategory,
            type_="complaint_priority",
            link=f"/complaints/{complaint.id}",
        )

    audit_log_repository.log(
        db, admin_id, "set_priority", "complaint", complaint_id,
        details=f"{old_priority.value} -> {priority.value}",
    )
    db.commit()
    db.refresh(complaint)
    return complaint


def request_more_info(db: Session, complaint_id: int, admin_id: int, message: str) -> Complaint:
    """Doesn't change status — just logs the request in the timeline and
    notifies the resident. Introducing a whole new 'awaiting info' status
    would ripple through every status check in this file; a note-only
    action is the minimal, additive way to support this per the
    'DO NOT rewrite existing code' constraint."""
    complaint = complaint_repository.get_by_id(db, complaint_id)
    if not complaint:
        raise NotFoundError(f"No complaint with id {complaint_id}.")

    _record_history(
        db, complaint, from_status=complaint.status, to_status=complaint.status,
        changed_by_type=ChangedByType.ADMIN, changed_by_id=admin_id,
        note=f"Requested more information: {message}",
    )
    notification_service.notify_resident(
        db, complaint.resident_id,
        title=f"More information needed: {complaint.complaint_code}",
        body=message,
        type_="complaint_info_requested",
        link=f"/complaints/{complaint.id}",
    )
    db.commit()
    db.refresh(complaint)
    return complaint


def add_internal_note(db: Session, complaint_id: int, admin_id: int, note: str):
    complaint = complaint_repository.get_by_id(db, complaint_id)
    if not complaint:
        raise NotFoundError(f"No complaint with id {complaint_id}.")
    return complaint_internal_note_repository.create(db, complaint_id, admin_id, note)


def list_internal_notes(db: Session, complaint_id: int):
    return complaint_internal_note_repository.list_for_complaint(db, complaint_id)


# --- Bulk actions ---

def bulk_assign_staff(db: Session, complaint_ids: list[int], staff_id: int, admin_id: int) -> tuple[list[int], list[dict]]:
    succeeded, failed = [], []
    for cid in complaint_ids:
        try:
            assign(db, cid, staff_id, admin_id)
            succeeded.append(cid)
        except (NotFoundError, InvalidStateError) as exc:
            failed.append({"complaint_id": cid, "error": str(exc)})
    return succeeded, failed


def bulk_change_priority(db: Session, complaint_ids: list[int], priority: ComplaintPriority, admin_id: int) -> tuple[list[int], list[dict]]:
    succeeded, failed = [], []
    for cid in complaint_ids:
        try:
            set_priority(db, cid, priority, admin_id)
            succeeded.append(cid)
        except NotFoundError as exc:
            failed.append({"complaint_id": cid, "error": str(exc)})
    return succeeded, failed


_STATUS_ACTIONS = {
    ComplaintStatus.ACCEPTED: lambda db, cid, admin_id: accept(db, cid, admin_id),
    ComplaintStatus.IN_PROGRESS: lambda db, cid, admin_id: start_progress(db, cid, admin_id),
    ComplaintStatus.RESOLVED: lambda db, cid, admin_id: resolve(db, cid, admin_id),
}


def bulk_change_status(db: Session, complaint_ids: list[int], status: ComplaintStatus, admin_id: int) -> tuple[list[int], list[dict]]:
    """Only supports statuses reachable without extra parameters (accept,
    start-progress, resolve) — assign/close need a staff_id or different
    endpoint and aren't included in bulk status changes."""
    action = _STATUS_ACTIONS.get(status)
    if action is None:
        raise InvalidStateError(
            f"Bulk status change to '{status.value}' is not supported — use the specific endpoint instead."
        )
    succeeded, failed = [], []
    for cid in complaint_ids:
        try:
            action(db, cid, admin_id)
            succeeded.append(cid)
        except (NotFoundError, InvalidStateError) as exc:
            failed.append({"complaint_id": cid, "error": str(exc)})
    return succeeded, failed


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
    about the other side's actions, not their own.

    ASSIGNED is deliberately skipped here — `assign()` already sends a
    more specific "Complaint Assigned" notification (with its own email
    template) right after calling this, so firing the generic one too
    would double-notify the resident for one action.
    """
    status_label = to_status.value.replace("_", " ")

    if to_status == ComplaintStatus.ASSIGNED:
        return

    if changed_by_type == ChangedByType.ADMIN:
        if to_status == ComplaintStatus.RESOLVED:
            subject, html = email_templates.complaint_resolved_email(complaint.complaint_code)
        else:
            subject, html = email_templates.complaint_status_changed_email(
                complaint.complaint_code, to_status.value
            )
        notification_service.notify_resident(
            db, complaint.resident_id,
            title=f"Complaint {complaint.complaint_code} updated",
            body=f"Your complaint is now '{status_label}'.",
            type_="complaint_status",
            link=f"/complaints/{complaint.id}",
            email_content=(subject, html),
        )
    elif to_status == ComplaintStatus.REOPENED:
        notification_service.notify_admins(
            db, _ADMIN_ROLES,
            title=f"Complaint {complaint.complaint_code} reopened",
            body="A resident was not satisfied with the resolution and reopened this complaint.",
            type_="complaint_reopened",
            link=f"/complaints/{complaint.id}",
        )
        subject, html = email_templates.complaint_reopened_email(
            complaint_code=complaint.complaint_code,
            resident_name=complaint.resident_name,
            house_code=complaint.house_code,
            original_description=complaint.description,
        )
        notification_service.notify_leadership_by_email(subject, html)


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
