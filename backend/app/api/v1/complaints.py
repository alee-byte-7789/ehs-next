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
from app.models.enums import AdminRole, ComplaintStatus
from app.models.resident import Resident
from app.schemas.complaint import (
    AssignStaffRequest,
    ComplaintCreateRequest,
    ComplaintDetailOut,
    ComplaintOut,
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


# --- Admin routes ---

@router.get("", response_model=list[ComplaintOut])
def list_complaints(
    status_filter: ComplaintStatus | None = None,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin_roles(AdminRole.HOUSING_OFFICE, AdminRole.IT_ADMIN, AdminRole.SUPER_ADMIN)),
) -> list[ComplaintOut]:
    return complaint_service.list_complaints(db, status_filter)


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
