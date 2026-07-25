"""Prayer timing service."""
from sqlalchemy.orm import Session

from app.models.enums import MosqueName
from app.models.prayer_timing import PrayerTiming
from app.repositories import prayer_timing_repository
from app.schemas.prayer_timing import PrayerTimingUpdateRequest


def list_prayer_timings(db: Session) -> list[PrayerTiming]:
    return prayer_timing_repository.list_all(db)


def get_prayer_timing(db: Session, mosque_name: MosqueName) -> PrayerTiming:
    return prayer_timing_repository.get_or_seed(db, mosque_name)


def update_prayer_timing(
    db: Session, mosque_name: MosqueName, req: PrayerTimingUpdateRequest, admin_id: int
) -> PrayerTiming:
    row = prayer_timing_repository.get_or_seed(db, mosque_name)
    row.fajr = req.fajr
    row.zuhr = req.zuhr
    row.asr = req.asr
    row.maghrib = req.maghrib
    row.isha = req.isha
    row.jummah = req.jummah
    row.updated_by_admin_id = admin_id
    db.commit()
    db.refresh(row)
    return row
