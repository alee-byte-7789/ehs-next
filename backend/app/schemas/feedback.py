"""Feedback schema — resident's post-resolution rating."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class FeedbackCreateRequest(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: str | None = Field(default=None, max_length=1000)


class FeedbackOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    complaint_id: int
    resident_id: int
    rating: int
    comment: str | None
    created_at: datetime
