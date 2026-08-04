"""Prayer timing schemas."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import MosqueName


class PrayerTimingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    mosque_name: MosqueName
    fajr: str
    zuhr: str
    asr: str
    maghrib: str
    isha: str
    jummah: str | None
    updated_at: datetime

    # Maghrib is resolved from today's sunset unless an admin entered an
    # explicit clock time. `maghrib_is_auto` lets the UI label it as such;
    # `sunset_today` is always populated so it can be shown either way.
    maghrib_is_auto: bool = False
    sunset_today: str | None = None


class PrayerTimingUpdateRequest(BaseModel):
    fajr: str = Field(min_length=1, max_length=20)
    zuhr: str = Field(min_length=1, max_length=20)
    asr: str = Field(min_length=1, max_length=20)
    maghrib: str = Field(min_length=1, max_length=20)
    isha: str = Field(min_length=1, max_length=20)
    jummah: str | None = Field(default=None, max_length=20)
