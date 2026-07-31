"""Notification service."""
from sqlalchemy.orm import Session

from app.models.enums import AdminRole, NotificationRecipientType
from app.models.notification import Notification
from app.repositories import admin_repository, notification_repository, resident_repository
from app.services import push_notification_service, push_notification_service_fcm
from app.services.errors import NotFoundError


def notify_resident(db: Session, resident_id: int, title: str, body: str, type_: str) -> Notification:
    notification = notification_repository.create(db, NotificationRecipientType.RESIDENT, resident_id, title, body, type_)
    resident = resident_repository.get_by_id(db, resident_id)
    if resident:
        push_notification_service.send_push(resident.push_token, title, body)
        push_notification_service_fcm.send_fcm_push(resident.fcm_token, title, body)
    return notification


def notify_admins(db: Session, roles: tuple[AdminRole, ...], title: str, body: str, type_: str) -> list[Notification]:
    """Broadcasts the same notification to every admin with one of the given roles."""
    admins = admin_repository.list_by_roles(db, roles)
    notifications = []
    for admin in admins:
        notifications.append(
            notification_repository.create(db, NotificationRecipientType.ADMIN, admin.id, title, body, type_)
        )
        push_notification_service.send_push(admin.push_token, title, body)
        push_notification_service_fcm.send_fcm_push(admin.fcm_token, title, body)
    return notifications


def notify_admin_by_id(db: Session, admin_id: int, title: str, body: str, type_: str) -> Notification:
    """Targets one specific admin — used when a complaint has an
    `assigned_admin_id`, per the enhancement spec's "the assigned
    administrator receives..." (as opposed to notify_admins, which
    broadcasts to everyone with a given role)."""
    notification = notification_repository.create(db, NotificationRecipientType.ADMIN, admin_id, title, body, type_)
    admin = admin_repository.get_by_id(db, admin_id)
    if admin:
        push_notification_service.send_push(admin.push_token, title, body)
        push_notification_service_fcm.send_fcm_push(admin.fcm_token, title, body)
    return notification


def list_my_notifications(db: Session, recipient_type: NotificationRecipientType, recipient_id: int) -> list[Notification]:
    return notification_repository.list_for_recipient(db, recipient_type, recipient_id)


def unread_count(db: Session, recipient_type: NotificationRecipientType, recipient_id: int) -> int:
    return notification_repository.unread_count(db, recipient_type, recipient_id)


def mark_read(db: Session, recipient_type: NotificationRecipientType, recipient_id: int, notification_id: int) -> Notification:
    row = notification_repository.get_by_id(db, notification_id)
    if not row or row.recipient_type != recipient_type or row.recipient_id != recipient_id:
        raise NotFoundError(f"No notification with id {notification_id} for this account.")
    row.is_read = True
    db.commit()
    db.refresh(row)
    return row
