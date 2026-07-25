"""Society info endpoint — About EHS, Chairman, Deputy Chairman, Secretary.
GET is public (no auth) since it's non-sensitive informational content.
PUT is admin-only — this content changes over time (elections, new
appointments) and shouldn't need a code deploy each time."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.v1.deps import get_db, require_admin_roles
from app.models.enums import AdminRole
from app.schemas.society_info import SocietyInfoOut, SocietyInfoUpdateRequest
from app.services import society_info_service

router = APIRouter(prefix="/society-info", tags=["society-info"])


@router.get("", response_model=SocietyInfoOut)
def get_society_info(db: Session = Depends(get_db)) -> SocietyInfoOut:
    return society_info_service.get_society_info(db)


@router.put("", response_model=SocietyInfoOut)
def update_society_info(
    req: SocietyInfoUpdateRequest,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin_roles(AdminRole.SUPER_ADMIN)),
) -> SocietyInfoOut:
    return society_info_service.update_society_info(db, req)
