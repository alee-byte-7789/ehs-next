"""Staff management endpoints."""
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.v1.deps import get_db, require_admin_roles
from app.models.enums import AdminRole
from app.schemas.staff import StaffCreateRequest, StaffOut
from app.services import staff_service

router = APIRouter(prefix="/staff", tags=["staff"])

_actor_roles = (AdminRole.HOUSING_OFFICE, AdminRole.SUPER_ADMIN)


@router.get("", response_model=list[StaffOut])
def list_staff(
    active_only: bool = True,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin_roles(AdminRole.HOUSING_OFFICE, AdminRole.IT_ADMIN, AdminRole.SUPER_ADMIN)),
) -> list[StaffOut]:
    return staff_service.list_active_staff(db) if active_only else staff_service.list_all_staff(db)


@router.post("", response_model=StaffOut, status_code=status.HTTP_201_CREATED)
def create_staff(
    req: StaffCreateRequest,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin_roles(*_actor_roles)),
) -> StaffOut:
    return staff_service.create_staff(db, req)
