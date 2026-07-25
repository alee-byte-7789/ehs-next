"""PrayerTiming repository — get-or-seed per mosque, plus the admin update."""
from sqlalchemy.orm import Session

from app.models.enums import MosqueName
from app.models.prayer_timing import PrayerTiming

# Placeholder times — seeded only so the panel isn't empty before an admin
# sets the real ones. NOT sourced from any real schedule; must be updated.
_DEFAULTS: dict[MosqueName, dict[str, str | None]] = {
    MosqueName.BILAL_MOSQUE: {
        "fajr": "5:00 AM", "zuhr": "1:30 PM", "asr": "5:00 PM",
        "maghrib": "Sunset", "isha": "8:00 PM", "jummah": "1:30 PM",
    },
    MosqueName.MARKAZI_JAMIA_MOSQUE: {
        "fajr": "5:00 AM", "zuhr": "1:30 PM", "asr": "5:00 PM",
        "maghrib": "Sunset", "isha": "8:00 PM", "jummah": "1:30 PM",
    },
}


def get_by_mosque(db: Session, mosque_name: MosqueName) -> PrayerTiming | None:
    return db.query(PrayerTiming).filter(PrayerTiming.mosque_name == mosque_name).first()


def get_or_seed(db: Session, mosque_name: MosqueName) -> PrayerTiming:
    row = get_by_mosque(db, mosque_name)
    if row:
        return row

    defaults = _DEFAULTS[mosque_name]
    row = PrayerTiming(mosque_name=mosque_name, **defaults)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def list_all(db: Session) -> list[PrayerTiming]:
    for mosque in MosqueName:
        get_or_seed(db, mosque)  # ensure both rows exist
    return db.query(PrayerTiming).order_by(PrayerTiming.mosque_name).all()
