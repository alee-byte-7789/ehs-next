"""Resident-facing Pydantic schemas."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.enums import NotificationPreference, ResidentType, VerificationStatus
from app.schemas.complaint import ComplaintOut
from app.schemas.registration_approval import RegistrationApprovalOut


class ResidentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    resident_code: str | None
    house_id: int
    house_code: str
    full_name: str
    phone: str
    email: str | None
    resident_type: ResidentType
    cnic: str | None
    verification_status: VerificationStatus
    notification_preference: NotificationPreference
    created_at: datetime


class ResidentDetailOut(BaseModel):
    """A resident's full profile for the admin Users detail page: base
    profile, complaint history, and who approved/rejected them and when."""

    model_config = ConfigDict(from_attributes=True)

    resident: ResidentOut
    complaints: list[ComplaintOut]
    approval_history: list[RegistrationApprovalOut]
    feedback_count: int
    complaint_count: int


class ResidentListItemOut(ResidentOut):
    """ResidentOut plus who approved this resident, for the Manage Users
    list — kept separate from ResidentOut (rather than adding these fields
    there directly) since ResidentOut is also used for residents' own
    `/me` responses and other contexts where an "approved by" column
    isn't relevant and isn't computed."""

    approved_by_admin_name: str | None = None
    approved_at: datetime | None = None
