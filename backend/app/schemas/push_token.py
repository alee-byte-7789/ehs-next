"""Push token registration schema."""
from pydantic import BaseModel, Field


class PushTokenRequest(BaseModel):
    push_token: str = Field(min_length=10, max_length=255)
