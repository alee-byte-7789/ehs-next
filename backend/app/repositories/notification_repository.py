"""Notification repository — plain DB access, no business rules."""
from sqlalchemy.orm import Session

from app.models.enums import NotificationRecipientType
from app.models.notification import Notification


def create(
    db: Session,
    recipient_type: NotificationRecipientType,
    recipient_id: int,
    title: str,
    body: str,
    type_: str,
) -> Notification:
    row = Notification(
        recipient_type=recipient_type, recipient_id=recipient_id,
        title=title, body=body, type=type_,
    )
    db.add(row)
    db.flush()
    return row


def list_for_recipient(
    db: Session, recipient_type: NotificationRecipientType, recipient_id: int
) -> list[Notification]:
    return (
        db.query(Notification)
        .filter(Notification.recipient_type == recipient_type, Notification.recipient_id == recipient_id)
        .order_by(Notification.created_at.desc())
        .all()
    )


def get_by_id(db: Session, notification_id: int) -> Notification | None:
    return db.query(Notification).filter(Notification.id == notification_id).first()


def unread_count(db: Session, recipient_type: NotificationRecipientType, recipient_id: int) -> int:
    return (
        db.query(Notification)
        .filter(
            Notification.recipient_type == recipient_type,
            Notification.recipient_id == recipient_id,
            Notification.is_read.is_(False),
        )
        .count()
    )
