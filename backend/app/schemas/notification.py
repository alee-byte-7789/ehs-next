"""Notification schema."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.enums import NotificationRecipientType


class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    recipient_type: NotificationRecipientType
    recipient_id: int
    title: str
    body: str
    type: str
    is_read: bool
    created_at: datetime
