"""Admin output schema and registration-approval action schemas."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import AdminRole
from app.schemas.resident import ResidentOut


class AdminOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: str
    role: AdminRole
    created_at: datetime


class CreateAdminRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: str = Field(min_length=3, max_length=120)
    password: str = Field(min_length=8, max_length=128)
    role: AdminRole


class RegistrationApprovedOut(BaseModel):
    message: str
    resident: ResidentOut


class RegistrationRejectedOut(BaseModel):
    message: str
    resident_id: int
