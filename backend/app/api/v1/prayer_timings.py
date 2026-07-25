"""Prayer timing endpoints.

GET is public (no auth) — same reasoning as society_info.py. PUT requires
admin auth via `require_admin_roles`, which works identically whether the
request comes from the Admin Portal website or an admin logged into the
mobile app — same backend endpoint, same JWT-based check either way.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.v1.deps import get_db, require_admin_roles
from app.models.enums import AdminRole, MosqueName
from app.schemas.prayer_timing import PrayerTimingOut, PrayerTimingUpdateRequest
from app.services import prayer_timing_service

router = APIRouter(prefix="/prayer-timings", tags=["prayer-timings"])

_actor_roles = (AdminRole.HOUSING_OFFICE, AdminRole.SUPER_ADMIN)


@router.get("", response_model=list[PrayerTimingOut])
def list_prayer_timings(db: Session = Depends(get_db)) -> list[PrayerTimingOut]:
    return prayer_timing_service.list_prayer_timings(db)


@router.put("/{mosque_name}", response_model=PrayerTimingOut)
def update_prayer_timing(
    mosque_name: MosqueName,
    req: PrayerTimingUpdateRequest,
    db: Session = Depends(get_db),
    admin=Depends(require_admin_roles(*_actor_roles)),
) -> PrayerTimingOut:
    return prayer_timing_service.update_prayer_timing(db, mosque_name, req, admin.id)
