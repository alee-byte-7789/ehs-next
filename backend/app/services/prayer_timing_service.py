"""Prayer timing service.

Maghrib is special: it is not a fixed clock time, it is sunset, which moves
by roughly a minute a day. Admins were entering the literal word "Sunset"
into the maghrib field, which meant the apps had nothing parseable to show
and — worse — the "Next Up" countdown silently skipped Maghrib entirely,
jumping straight from Asr to Isha.

So maghrib is now RESOLVED on read:
  - if an admin has entered a real clock time, that wins (some mosques
    announce a fixed time rather than exact sunset), and
  - otherwise it is computed from today's actual sunset for the society's
    coordinates.

`sunset_today` is always returned regardless, so the UI can label the value
as sunset-derived.
"""
import re
from datetime import date, datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.enums import MosqueName
from app.models.prayer_timing import PrayerTiming
from app.repositories import prayer_timing_repository
from app.schemas.prayer_timing import PrayerTimingOut, PrayerTimingUpdateRequest
from app.services import sunset_service

# Matches the "7:07 PM" style the apps parse. Anything that does NOT match
# (the word "Sunset", blank, "auto", ...) is treated as "derive from sunset".
_CLOCK_TIME_RE = re.compile(r"^\d{1,2}:\d{2}\s*(AM|PM)$", re.IGNORECASE)


def _today_local() -> date:
    """Today's date at the society, not in UTC — at 23:00 UTC it is already
    tomorrow in Pakistan, and using the UTC date would show the wrong
    sunset for several hours every night."""
    settings = get_settings()
    now_local = datetime.now(timezone.utc) + timedelta(hours=settings.society_utc_offset_hours)
    return now_local.date()


def _resolve(row: PrayerTiming) -> PrayerTimingOut:
    settings = get_settings()

    sunset_time = sunset_service.sunset_local(
        _today_local(),
        settings.society_latitude,
        settings.society_longitude,
        settings.society_utc_offset_hours,
    )
    sunset_str = sunset_service.format_12h(sunset_time) if sunset_time else None

    stored = (row.maghrib or "").strip()
    if _CLOCK_TIME_RE.match(stored):
        maghrib, is_auto = stored, False
    elif sunset_str:
        maghrib, is_auto = sunset_str, True
    else:
        # Sunset couldn't be computed (not possible at this latitude, but
        # don't invent a time) — fall back to whatever was stored.
        maghrib, is_auto = stored or "Sunset", False

    return PrayerTimingOut(
        mosque_name=row.mosque_name,
        fajr=row.fajr,
        zuhr=row.zuhr,
        asr=row.asr,
        maghrib=maghrib,
        isha=row.isha,
        jummah=row.jummah,
        updated_at=row.updated_at,
        maghrib_is_auto=is_auto,
        sunset_today=sunset_str,
    )


def list_prayer_timings(db: Session) -> list[PrayerTimingOut]:
    return [_resolve(row) for row in prayer_timing_repository.list_all(db)]


def get_prayer_timing(db: Session, mosque_name: MosqueName) -> PrayerTimingOut:
    return _resolve(prayer_timing_repository.get_or_seed(db, mosque_name))


def update_prayer_timing(
    db: Session, mosque_name: MosqueName, req: PrayerTimingUpdateRequest, admin_id: int
) -> PrayerTimingOut:
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
    return _resolve(row)
