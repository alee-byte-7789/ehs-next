"""Admin management endpoints — creating and listing admin accounts.

Restricted to `super_admin` only. Housing Office and IT Admin roles can
approve registrations and manage their own areas, but only a Super Admin
can create new admin accounts — letting any admin role grant admin access
would be a privilege-escalation path.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.v1.deps import get_db, require_admin_roles
from app.models.enums import AdminRole
from app.schemas.admin import AdminOut, CreateAdminRequest
from app.services import admin_service
from app.services.errors import ConflictError

router = APIRouter(prefix="/admins", tags=["admins"])

_super_admin_only = (AdminRole.SUPER_ADMIN,)


@router.get("", response_model=list[AdminOut])
def list_admins(
    db: Session = Depends(get_db),
    _admin=Depends(require_admin_roles(*_super_admin_only)),
) -> list[AdminOut]:
    return admin_service.list_admins(db)


@router.post("", response_model=AdminOut, status_code=status.HTTP_201_CREATED)
def create_admin(
    req: CreateAdminRequest,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin_roles(*_super_admin_only)),
) -> AdminOut:
    try:
        return admin_service.create_admin(db, req)
    except ConflictError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
