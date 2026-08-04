"""Push token repository — plain DB access, no business rules."""
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.enums import NotificationRecipientType, PushTokenKind
from app.models.push_token import PushToken


def upsert(
    db: Session,
    owner_type: NotificationRecipientType,
    owner_id: int,
    token: str,
    kind: PushTokenKind,
) -> PushToken:
    """
    Registers a device token, or refreshes it if already known.

    Device tokens are globally unique, so an existing row for the same
    token is REASSIGNED to the current owner rather than duplicated. That
    matters for a shared browser or phone: if one person signs out and
    another signs in, the device must stop notifying the previous owner.
    """
    now = datetime.now(timezone.utc)
    existing = db.query(PushToken).filter(PushToken.token == token).first()

    if existing:
        existing.owner_type = owner_type
        existing.owner_id = owner_id
        existing.kind = kind
        existing.last_seen_at = now
        db.flush()
        return existing

    row = PushToken(
        owner_type=owner_type, owner_id=owner_id, token=token, kind=kind,
        created_at=now, last_seen_at=now,
    )
    db.add(row)
    db.flush()
    return row


def list_for_owner(
    db: Session, owner_type: NotificationRecipientType, owner_id: int
) -> list[PushToken]:
    """Every device this owner has registered — the whole point of this table."""
    return (
        db.query(PushToken)
        .filter(PushToken.owner_type == owner_type, PushToken.owner_id == owner_id)
        .all()
    )


def delete_by_token(db: Session, token: str) -> None:
    """Used when a provider reports a token as permanently dead."""
    db.query(PushToken).filter(PushToken.token == token).delete()
    db.flush()
