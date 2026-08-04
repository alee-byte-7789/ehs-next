"""
Push token registry — one row per DEVICE, not per user.

Replaces the single `fcm_token` / `push_token` columns that previously
lived on Resident and Admin. Those were scalar fields, so every new
device that opened the app overwrote the previous one: an admin with a
desk PC and a phone could only ever receive notifications on whichever
device had opened the app most recently.

`token` is globally unique. If the same device token gets registered
while a DIFFERENT user is signed in (shared browser, or one person logs
out and another logs in), the existing row is reassigned to the new
owner rather than duplicated — otherwise the previous owner would keep
receiving notifications on a device that is no longer theirs.
"""
from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.enums import NotificationRecipientType, PushTokenKind


class PushToken(Base):
    __tablename__ = "push_tokens"
    __table_args__ = (UniqueConstraint("token", name="uq_push_tokens_token"),)

    id: Mapped[int] = mapped_column(primary_key=True)

    owner_type: Mapped[NotificationRecipientType] = mapped_column(
        Enum(NotificationRecipientType), nullable=False
    )
    owner_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)

    token: Mapped[str] = mapped_column(String(512), nullable=False)
    kind: Mapped[PushTokenKind] = mapped_column(Enum(PushTokenKind), nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    # Refreshed every time the device re-registers (which happens on each
    # app open), so a stale row is identifiable even if the provider
    # never explicitly reports the token as dead.
    last_seen_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    def __repr__(self) -> str:
        return f"<PushToken {self.kind.value} {self.owner_type.value}:{self.owner_id}>"
