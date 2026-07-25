"""Complaint schemas."""
import json
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.enums import ChangedByType, ComplaintCategory, ComplaintStatus


class ComplaintCreateRequest(BaseModel):
    category: ComplaintCategory
    subcategory: str = Field(min_length=2, max_length=80)
    description: str = Field(min_length=5, max_length=2000)
    photo_urls: list[str] | None = None


class ComplaintOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    complaint_code: str
    resident_id: int
    house_id: int
    category: ComplaintCategory
    subcategory: str
    description: str
    photo_urls: list[str] | None = None
    status: ComplaintStatus
    assigned_staff_id: int | None
    close_count: int
    created_at: datetime
    updated_at: datetime
    closed_at: datetime | None

    @field_validator("photo_urls", mode="before")
    @classmethod
    def parse_photo_urls(cls, v: object) -> object:
        """The DB column is a JSON-encoded string (Text), not a native
        array — see app/models/complaint.py's docstring for why. Parse it
        here so API responses give clients a real list."""
        if isinstance(v, str):
            return json.loads(v)
        return v


class ComplaintHistoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    from_status: ComplaintStatus | None
    to_status: ComplaintStatus
    changed_by_type: ChangedByType
    changed_by_id: int | None
    note: str | None
    timestamp: datetime


class ComplaintDetailOut(ComplaintOut):
    history: list[ComplaintHistoryOut]


class AssignStaffRequest(BaseModel):
    staff_id: int


class ActionNoteRequest(BaseModel):
    """Optional note attached to a status-changing action (accept/resolve/etc.)."""
    note: str | None = Field(default=None, max_length=1000)
