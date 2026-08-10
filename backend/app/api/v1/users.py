"""
Admin-facing resident ("Users") endpoints.

Separate from `/residents/me` in me.py, which is the resident's own view of
themselves. Everything here requires an admin token — a resident hitting any
of it gets 403 from `get_current_admin`, which is the same guard the rest of
the admin surface uses.

Mostly read-only: admins look residents up and inspect their history.

The exceptions are the three privileged account-management routes at the
bottom — password reset, manual creation and deletion. Those are gated by
role and every one of them writes an audit row (see admin_action_service).
"""
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.v1.deps import get_current_admin, get_db, require_admin_roles
from app.models.enums import AdminRole, ResidentType, VerificationStatus
from app.repositories import (
    complaint_repository,
    feedback_repository,
    registration_approval_repository,
    resident_repository,
)
from app.schemas.admin_actions import (
    DeleteRegistrationRequest,
    ManualRegisterRequest,
    ResetPasswordRequest,
)
from app.schemas.complaint import ComplaintOut
from app.schemas.registration_approval import RegistrationApprovalOut
from app.schemas.resident import ResidentDetailOut, ResidentOut
from app.services import admin_action_service
from app.services.errors import ConflictError, InvalidStateError, NotFoundError

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=list[ResidentOut])
def list_users(
    q: str | None = None,
    resident_type: ResidentType | None = None,
    verification_status: VerificationStatus | None = None,
    created_from: datetime | None = None,
    created_to: datetime | None = None,
    limit: int = 200,
    db: Session = Depends(get_db),
    _admin=Depends(get_current_admin),
) -> list[ResidentOut]:
    """All registered residents, searchable and filterable.

    `q` is a single free-text box matching name, resident code, phone,
    email, CNIC or house code.
    """
    return resident_repository.search(
        db,
        q=q,
        resident_type=resident_type,
        status=verification_status,
        created_from=created_from,
        created_to=created_to,
        limit=limit,
    )


@router.get("/{resident_id}", response_model=ResidentDetailOut)
def get_user(
    resident_id: int,
    db: Session = Depends(get_db),
    _admin=Depends(get_current_admin),
) -> ResidentDetailOut:
    """One resident's full profile: registration details, who approved them,
    and their complaint and feedback history — the whole picture in a single
    request, since the admin UI shows it on one screen."""
    resident = resident_repository.get_by_id(db, resident_id)
    if not resident:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resident not found.")

    complaints = complaint_repository.list_for_resident(db, resident_id)
    approvals = registration_approval_repository.list_for_resident(db, resident_id)
    feedback = feedback_repository.list_for_resident(db, resident_id)

    return ResidentDetailOut(
        resident=ResidentOut.model_validate(resident),
        complaints=[ComplaintOut.model_validate(c) for c in complaints],
        approval_history=[RegistrationApprovalOut.model_validate(a) for a in approvals],
        feedback_count=len(feedback),
        complaint_count=len(complaints),
    )


# ---------------------------------------------------------------------------
# Privileged account management
#
# Role choices mirror the existing matrix: Housing Office and Super Admin
# already own registration approval, so they own these too. Deletion is
# irreversible, so it is Super Admin only.
# ---------------------------------------------------------------------------
_manage_roles = (AdminRole.HOUSING_OFFICE, AdminRole.SUPER_ADMIN)


@router.post("/{resident_id}/reset-password", response_model=ResidentOut)
def reset_resident_password(
    resident_id: int,
    req: ResetPasswordRequest,
    db: Session = Depends(get_db),
    admin=Depends(require_admin_roles(*_manage_roles)),
) -> ResidentOut:
    """Sets a new password for a resident who has forgotten theirs.

    The old password is not required — that is the point of the flow.
    """
    try:
        return admin_action_service.reset_resident_password(db, resident_id, req.new_password, admin)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.post("", response_model=ResidentOut, status_code=status.HTTP_201_CREATED)
def manual_register(
    req: ManualRegisterRequest,
    db: Session = Depends(get_db),
    admin=Depends(require_admin_roles(*_manage_roles)),
) -> ResidentOut:
    """Creates a resident by hand, already approved."""
    try:
        return admin_action_service.manual_register(db, req, admin)
    except ConflictError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc


@router.delete("/{resident_id}")
def delete_registration(
    resident_id: int,
    req: DeleteRegistrationRequest,
    db: Session = Depends(get_db),
    admin=Depends(require_admin_roles(AdminRole.SUPER_ADMIN)),
) -> dict:
    """Permanently deletes a registration. Refused if the resident has
    complaints or feedback on record — reject those instead, which keeps
    the history."""
    try:
        label = admin_action_service.delete_registration(db, resident_id, req.reason, admin)
        return {"message": f"Deleted registration for {label}."}
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except InvalidStateError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
