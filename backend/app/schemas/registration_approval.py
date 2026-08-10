"""Schema for a single registration decision, as shown in a resident's
approval history on the admin Users page."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.enums import ResidentType, VerificationStatus


class RegistrationApprovalOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    resident_id: int
    house_id: int
    resident_name: str
    house_code: str
    resident_type: ResidentType
    resident_code: str | None
    decision: VerificationStatus
    decided_by_admin_id: int
    decided_by_admin_name: str
    reason: str | None
    decided_at: datetime
