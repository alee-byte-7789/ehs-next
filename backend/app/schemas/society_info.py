"""Society info schema — About EHS, Secretary, Deputy Chairman."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class SocietyInfoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    about_text: str
    secretary_name: str | None
    secretary_designation: str | None
    deputy_chairman_name: str | None
    deputy_chairman_message: str | None
    updated_at: datetime
