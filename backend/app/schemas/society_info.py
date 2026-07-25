"""Society info schema — About EHS, Chairman, Deputy Chairman, Secretary."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class SocietyInfoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    about_text: str
    chairman_name: str | None
    chairman_message: str | None
    deputy_chairman_name: str | None
    deputy_chairman_message: str | None
    secretary_name: str | None
    secretary_designation: str | None
    secretary_message: str | None
    updated_at: datetime


class SocietyInfoUpdateRequest(BaseModel):
    """All fields optional — only the ones provided get updated, everything
    else stays as-is (see society_info_repository.update)."""
    about_text: str | None = None
    chairman_name: str | None = None
    chairman_message: str | None = None
    deputy_chairman_name: str | None = None
    deputy_chairman_message: str | None = None
    secretary_name: str | None = None
    secretary_designation: str | None = None
    secretary_message: str | None = None
