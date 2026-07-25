"""Complaint endpoints.

Resident routes use `get_current_resident`; admin routes use
`require_admin_roles`. Both live in one router, organized by resource
(complaints) rather than by actor, matching this codebase's existing
convention (see registrations.py for the admin-only case, auth.py for the
resident-only case) — here we deliberately mix both since a complaint is
one resource both actors work with.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.v1.deps import get_current_resident, get_db, require_admin_roles
from app.models.enums import AdminRole, ComplaintCategory, ComplaintPriority, ComplaintStatus
from app.models.resident import Resident
from app.schemas.complaint import (
    AssignDepartmentRequest,
    AssignStaffRequest,
    BulkActionResult,
    BulkAssignStaffRequest,
    BulkPriorityRequest,
    BulkStatusRequest,
    ComplaintCreateRequest,
    ComplaintDetailOut,
    ComplaintOut,
    EarlyCloseRequest,
    InternalNoteCreateRequest,
    InternalNoteOut,
    PriorityUpdateRequest,
    ReassignStaffRequest,
    RequestInfoRequest,
)
from app.services import complaint_service
from app.services.errors import InvalidStateError, NotFoundError

router = APIRouter(prefix="/complaints", tags=["complaints"])

# Complaint status changes (accept/assign/start/resolve/admin-close) are
# restricted to the same roles that handle registration approval — Housing
# Office day-to-day operations, or Super Admin. IT Admin can still view
# (see the plain require_admin_roles() with no args on the list/view routes
# below — any admin role may read, only these two may act).
_actor_roles = (AdminRole.HOUSING_OFFICE, AdminRole.SUPER_ADMIN)


# --- Resident routes ---

@router.post("", response_model=ComplaintOut, status_code=status.HTTP_201_CREATED)
def create_complaint(
    req: ComplaintCreateRequest,
    db: Session = Depends(get_db),
    resident: Resident = Depends(get_current_resident),
) -> ComplaintOut:
    return complaint_service.create_complaint(db, resident, req)


@router.get("/mine", response_model=list[ComplaintOut])
def list_my_complaints(
    db: Session = Depends(get_db),
    resident: Resident = Depends(get_current_resident),
) -> list[ComplaintOut]:
    return complaint_service.list_own_complaints(db, resident)


@router.get("/mine/{complaint_id}", response_model=ComplaintDetailOut)
def get_my_complaint(
    complaint_id: int,
    db: Session = Depends(get_db),
    resident: Resident = Depends(get_current_resident),
) -> ComplaintDetailOut:
    try:
        return complaint_service.get_own_complaint(db, resident, complaint_id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.post("/{complaint_id}/close", response_model=ComplaintOut)
def close_complaint_as_resident(
    complaint_id: int,
    db: Session = Depends(get_db),
    resident: Resident = Depends(get_current_resident),
) -> ComplaintOut:
    try:
        return complaint_service.close_by_resident(db, resident, complaint_id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except InvalidStateError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc


@router.post("/{complaint_id}/reopen", response_model=ComplaintOut)
def reopen_complaint_as_resident(
    complaint_id: int,
    db: Session = Depends(get_db),
    resident: Resident = Depends(get_current_resident),
) -> ComplaintOut:
    try:
        return complaint_service.reopen_by_resident(db, resident, complaint_id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except InvalidStateError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc


@router.post("/{complaint_id}/close-early", response_model=ComplaintOut)
def close_complaint_early_as_resident(
    complaint_id: int,
    req: EarlyCloseRequest,
    db: Session = Depends(get_db),
    resident: Resident = Depends(get_current_resident),
) -> ComplaintOut:
    """Enhancement spec: resident closes a complaint that's already
    resolved before any admin has acted — only works from PENDING."""
    try:
        return complaint_service.close_by_resident_early(db, resident, complaint_id, req.reason)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except InvalidStateError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc


# --- Admin routes ---

@router.get("", response_model=list[ComplaintOut])
def list_complaints(
    status_filter: ComplaintStatus | None = None,
    priority_filter: ComplaintPriority | None = None,
    category_filter: ComplaintCategory | None = None,
    assigned_admin_id: int | None = None,
    assigned_staff_id: int | None = None,
    search: str | None = None,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin_roles(AdminRole.HOUSING_OFFICE, AdminRole.IT_ADMIN, AdminRole.SUPER_ADMIN)),
) -> list[ComplaintOut]:
    return complaint_service.list_complaints(
        db, status_filter, priority_filter, category_filter, assigned_admin_id, assigned_staff_id, search
    )


@router.get("/dashboard")
def dashboard_counts(
    db: Session = Depends(get_db),
    admin=Depends(require_admin_roles(AdminRole.HOUSING_OFFICE, AdminRole.IT_ADMIN, AdminRole.SUPER_ADMIN)),
) -> dict[str, int]:
    """Backs the admin dashboard widgets (Section 7 of the enhancement
    spec). Registered BEFORE the generic `/{complaint_id}` route below —
    otherwise "dashboard" would be parsed as an invalid complaint_id."""
    return complaint_service.dashboard_counts(db, admin.id)


@router.get("/{complaint_id}", response_model=ComplaintDetailOut)
def get_complaint(
    complaint_id: int,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin_roles(AdminRole.HOUSING_OFFICE, AdminRole.IT_ADMIN, AdminRole.SUPER_ADMIN)),
) -> ComplaintDetailOut:
    try:
        return complaint_service.get_complaint_detail(db, complaint_id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.post("/{complaint_id}/accept", response_model=ComplaintOut)
def accept_complaint(
    complaint_id: int,
    db: Session = Depends(get_db),
    admin=Depends(require_admin_roles(*_actor_roles)),
) -> ComplaintOut:
    try:
        return complaint_service.accept(db, complaint_id, admin.id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except InvalidStateError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc


@router.post("/{complaint_id}/assign", response_model=ComplaintOut)
def assign_complaint(
    complaint_id: int,
    req: AssignStaffRequest,
    db: Session = Depends(get_db),
    admin=Depends(require_admin_roles(*_actor_roles)),
) -> ComplaintOut:
    try:
        return complaint_service.assign(db, complaint_id, req.staff_id, admin.id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except InvalidStateError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc


@router.post("/{complaint_id}/start-progress", response_model=ComplaintOut)
def start_progress(
    complaint_id: int,
    db: Session = Depends(get_db),
    admin=Depends(require_admin_roles(*_actor_roles)),
) -> ComplaintOut:
    try:
        return complaint_service.start_progress(db, complaint_id, admin.id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except InvalidStateError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc


@router.post("/{complaint_id}/resolve", response_model=ComplaintOut)
def resolve_complaint(
    complaint_id: int,
    db: Session = Depends(get_db),
    admin=Depends(require_admin_roles(*_actor_roles)),
) -> ComplaintOut:
    try:
        return complaint_service.resolve(db, complaint_id, admin.id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except InvalidStateError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc


@router.post("/{complaint_id}/admin-close", response_model=ComplaintOut)
def close_complaint_as_admin(
    complaint_id: int,
    db: Session = Depends(get_db),
    admin=Depends(require_admin_roles(*_actor_roles)),
) -> ComplaintOut:
    try:
        return complaint_service.close_by_admin(db, complaint_id, admin.id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except InvalidStateError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc


@router.post("/{complaint_id}/reassign", response_model=ComplaintOut)
def reassign_complaint(
    complaint_id: int,
    req: ReassignStaffRequest,
    db: Session = Depends(get_db),
    admin=Depends(require_admin_roles(*_actor_roles)),
) -> ComplaintOut:
    """Changes staff on an already-ASSIGNED/IN_PROGRESS complaint — see
    complaint_service.reassign_staff for how this differs from `assign`."""
    try:
        return complaint_service.reassign_staff(db, complaint_id, req.staff_id, admin.id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except InvalidStateError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc


@router.post("/{complaint_id}/assign-department", response_model=ComplaintOut)
def assign_department(
    complaint_id: int,
    req: AssignDepartmentRequest,
    db: Session = Depends(get_db),
    admin=Depends(require_admin_roles(AdminRole.SUPER_ADMIN)),
) -> ComplaintOut:
    """Super Admin only — routes a complaint to a specific department
    admin (Housing Office / IT / Maintenance), per Section 3 of the
    enhancement spec."""
    try:
        return complaint_service.assign_department(db, complaint_id, req.admin_id, admin.id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.post("/{complaint_id}/escalate", response_model=ComplaintOut)
def escalate_complaint(
    complaint_id: int,
    db: Session = Depends(get_db),
    admin=Depends(require_admin_roles(*_actor_roles)),
) -> ComplaintOut:
    try:
        return complaint_service.escalate(db, complaint_id, admin.id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.put("/{complaint_id}/priority", response_model=ComplaintOut)
def set_priority(
    complaint_id: int,
    req: PriorityUpdateRequest,
    db: Session = Depends(get_db),
    admin=Depends(require_admin_roles(*_actor_roles)),
) -> ComplaintOut:
    try:
        return complaint_service.set_priority(db, complaint_id, req.priority, admin.id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.post("/{complaint_id}/request-info", response_model=ComplaintOut)
def request_more_info(
    complaint_id: int,
    req: RequestInfoRequest,
    db: Session = Depends(get_db),
    admin=Depends(require_admin_roles(*_actor_roles)),
) -> ComplaintOut:
    try:
        return complaint_service.request_more_info(db, complaint_id, admin.id, req.message)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.get("/{complaint_id}/notes", response_model=list[InternalNoteOut])
def list_internal_notes(
    complaint_id: int,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin_roles(AdminRole.HOUSING_OFFICE, AdminRole.IT_ADMIN, AdminRole.SUPER_ADMIN)),
) -> list[InternalNoteOut]:
    """Admin-only, never exposed via any resident-facing route — see
    ComplaintInternalNote's model docstring."""
    return complaint_service.list_internal_notes(db, complaint_id)


@router.post("/{complaint_id}/notes", response_model=InternalNoteOut, status_code=status.HTTP_201_CREATED)
def add_internal_note(
    complaint_id: int,
    req: InternalNoteCreateRequest,
    db: Session = Depends(get_db),
    admin=Depends(require_admin_roles(AdminRole.HOUSING_OFFICE, AdminRole.IT_ADMIN, AdminRole.SUPER_ADMIN)),
) -> InternalNoteOut:
    try:
        return complaint_service.add_internal_note(db, complaint_id, admin.id, req.note)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


# --- Bulk actions ---

@router.post("/bulk/assign-staff", response_model=BulkActionResult)
def bulk_assign_staff(
    req: BulkAssignStaffRequest,
    db: Session = Depends(get_db),
    admin=Depends(require_admin_roles(*_actor_roles)),
) -> BulkActionResult:
    succeeded, failed = complaint_service.bulk_assign_staff(db, req.complaint_ids, req.staff_id, admin.id)
    return BulkActionResult(succeeded=succeeded, failed=failed)


@router.post("/bulk/priority", response_model=BulkActionResult)
def bulk_change_priority(
    req: BulkPriorityRequest,
    db: Session = Depends(get_db),
    admin=Depends(require_admin_roles(*_actor_roles)),
) -> BulkActionResult:
    succeeded, failed = complaint_service.bulk_change_priority(db, req.complaint_ids, req.priority, admin.id)
    return BulkActionResult(succeeded=succeeded, failed=failed)


@router.post("/bulk/status", response_model=BulkActionResult)
def bulk_change_status(
    req: BulkStatusRequest,
    db: Session = Depends(get_db),
    admin=Depends(require_admin_roles(*_actor_roles)),
) -> BulkActionResult:
    try:
        succeeded, failed = complaint_service.bulk_change_status(db, req.complaint_ids, req.status, admin.id)
    except InvalidStateError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return BulkActionResult(succeeded=succeeded, failed=failed)
