"""Audit log schema."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AuditLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    actor_admin_id: int | None
    action: str
    entity_type: str
    entity_id: int | None
    details: str | None
    created_at: datetime
