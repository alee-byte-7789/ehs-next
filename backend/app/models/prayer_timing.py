"""PrayerTiming model — one row per mosque.

Times are stored as plain strings (e.g. "5:30 AM") rather than a Time type
so admins can enter them exactly as they'd be announced/displayed, without
fighting a strict time-picker format for something that's just shown as
text in the app, not used in any date-math.
"""
from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.enums import MosqueName


class PrayerTiming(Base):
    __tablename__ = "prayer_timings"

    id: Mapped[int] = mapped_column(primary_key=True)
    mosque_name: Mapped[MosqueName] = mapped_column(Enum(MosqueName), unique=True, nullable=False)

    fajr: Mapped[str] = mapped_column(String(20), nullable=False)
    zuhr: Mapped[str] = mapped_column(String(20), nullable=False)
    asr: Mapped[str] = mapped_column(String(20), nullable=False)
    maghrib: Mapped[str] = mapped_column(String(20), nullable=False)
    isha: Mapped[str] = mapped_column(String(20), nullable=False)
    jummah: Mapped[str | None] = mapped_column(String(20), nullable=True)

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    updated_by_admin_id: Mapped[int | None] = mapped_column(Integer, nullable=True)

    def __repr__(self) -> str:
        return f"<PrayerTiming {self.mosque_name.value}>"
