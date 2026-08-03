"""Resident-facing Pydantic schemas."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.enums import NotificationPreference, ResidentType, VerificationStatus


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
    is_employee: bool
    employee_number: str | None
    verification_status: VerificationStatus
    notification_preference: NotificationPreference
    created_at: datetime
