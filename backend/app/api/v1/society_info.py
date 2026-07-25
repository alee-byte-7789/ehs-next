"""Society info endpoint — About EHS, Secretary, Deputy Chairman. Public
(no auth) since it's non-sensitive informational content shown to anyone
using the app, same spirit as a public "About" page."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.v1.deps import get_db
from app.schemas.society_info import SocietyInfoOut
from app.services import society_info_service

router = APIRouter(prefix="/society-info", tags=["society-info"])


@router.get("", response_model=SocietyInfoOut)
def get_society_info(db: Session = Depends(get_db)) -> SocietyInfoOut:
    return society_info_service.get_society_info(db)
