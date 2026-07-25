"""Complaint schemas."""
import json
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.enums import ChangedByType, ComplaintCategory, ComplaintPriority, ComplaintStatus


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
    priority: ComplaintPriority
    assigned_staff_id: int | None
    assigned_admin_id: int | None
    close_count: int
    closed_by_resident_early: bool
    early_close_reason: str | None
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


# --- Enhancement spec additions ---

class EarlyCloseRequest(BaseModel):
    reason: str = Field(min_length=3, max_length=1000)


class ReassignStaffRequest(BaseModel):
    staff_id: int


class AssignDepartmentRequest(BaseModel):
    admin_id: int


class PriorityUpdateRequest(BaseModel):
    priority: ComplaintPriority


class RequestInfoRequest(BaseModel):
    message: str = Field(min_length=3, max_length=1000)


class InternalNoteCreateRequest(BaseModel):
    note: str = Field(min_length=1, max_length=2000)


class InternalNoteOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    complaint_id: int
    admin_id: int
    note: str
    created_at: datetime


class BulkAssignStaffRequest(BaseModel):
    complaint_ids: list[int] = Field(min_length=1)
    staff_id: int


class BulkStatusRequest(BaseModel):
    complaint_ids: list[int] = Field(min_length=1)
    status: ComplaintStatus


class BulkPriorityRequest(BaseModel):
    complaint_ids: list[int] = Field(min_length=1)
    priority: ComplaintPriority


class BulkActionResult(BaseModel):
    succeeded: list[int]
    failed: list[dict]
