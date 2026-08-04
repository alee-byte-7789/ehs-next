"""
Notification service — the single dispatch point for every notification
channel: in-app (always recorded), push (Expo + Firebase), and email.

Each channel respects the resident's `notification_preference` (push_only /
email_only / push_and_email / none) — even though no Settings UI exists
yet to change it, every call site already goes through here, so wiring up
that UI later needs zero changes to the dispatch logic itself.

Admins don't have a notification_preference field (they're expected to
always want both), so admin-targeted sends always attempt both push
channels.
"""
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.enums import AdminRole, NotificationPreference, NotificationRecipientType, PushTokenKind
from app.models.notification import Notification
from app.models.resident import Resident
from app.repositories import (
    admin_repository,
    notification_repository,
    push_token_repository,
    resident_repository,
)
from app.services import email_service, push_notification_service, push_notification_service_fcm
from app.services.errors import NotFoundError


def _wants_push(resident: Resident) -> bool:
    return resident.notification_preference in (
        NotificationPreference.PUSH_AND_EMAIL, NotificationPreference.PUSH_ONLY,
    )


def _wants_email(resident: Resident) -> bool:
    return resident.notification_preference in (
        NotificationPreference.PUSH_AND_EMAIL, NotificationPreference.EMAIL_ONLY,
    )


def _dispatch_push(
    db: Session,
    owner_type: NotificationRecipientType,
    owner_id: int,
    title: str,
    body: str,
    link: str,
) -> None:
    """
    Sends to EVERY device this owner has registered, and deletes any token
    the provider reports as permanently dead.

    Previously this read a single `fcm_token` / `push_token` column off the
    Resident/Admin row, which meant one device per account: whichever
    device opened the app most recently silently overwrote the previous
    one. An admin with a desk PC and a phone could only ever be reached on
    one of them. Tokens now live in their own table, one row per device.

    A dead token (browser data cleared, PWA uninstalled, permission
    revoked, or normal rotation) is deleted rather than retried forever —
    and only that one device's row is removed, so it never takes the
    owner's other working devices down with it.
    """
    tokens = push_token_repository.list_for_owner(db, owner_type, owner_id)
    if not tokens:
        return

    dead: list[str] = []
    for entry in tokens:
        if entry.kind == PushTokenKind.EXPO:
            result = push_notification_service.send_push(entry.token, title, body, link=link)
        else:
            result = push_notification_service_fcm.send_fcm_push(entry.token, title, body, link=link)

        if result.get("token_invalid"):
            dead.append(entry.token)

    for token in dead:
        push_token_repository.delete_by_token(db, token)


def notify_resident(
    db: Session,
    resident_id: int,
    title: str,
    body: str,
    type_: str,
    email_content: tuple[str, str] | None = None,
    link: str = "/notifications",
) -> Notification:
    """
    `email_content`, if given, is (subject, html_body) built from a
    specific template in email_templates.py — the in-app title/body pair
    is too short to make a good email, so callers that want a real email
    pass the rendered template explicitly.

    `link` is where tapping the push notification navigates to. Defaults
    to the notifications inbox rather than a specific complaint, since
    threading a complaint ID through every call site would touch a lot
    more code — this is a real improvement over no navigation at all,
    not full deep-linking.
    """
    notification = notification_repository.create(db, NotificationRecipientType.RESIDENT, resident_id, title, body, type_)
    resident = resident_repository.get_by_id(db, resident_id)
    if not resident:
        return notification

    if _wants_push(resident):
        _dispatch_push(db, NotificationRecipientType.RESIDENT, resident.id, title, body, link)

    if email_content and _wants_email(resident) and resident.email:
        subject, html = email_content
        email_service.send_email(resident.email, subject, html)

    return notification


def notify_admins(
    db: Session, roles: tuple[AdminRole, ...], title: str, body: str, type_: str, link: str = "/complaints"
) -> list[Notification]:
    """Broadcasts the same notification to every admin with one of the given roles."""
    admins = admin_repository.list_by_roles(db, roles)
    notifications = []
    for admin in admins:
        notifications.append(
            notification_repository.create(db, NotificationRecipientType.ADMIN, admin.id, title, body, type_)
        )
        _dispatch_push(db, NotificationRecipientType.ADMIN, admin.id, title, body, link)
    return notifications


def notify_admin_by_id(
    db: Session, admin_id: int, title: str, body: str, type_: str, link: str = "/complaints"
) -> Notification:
    """Targets one specific admin — used when a complaint has an
    `assigned_admin_id` (the department-routing feature)."""
    notification = notification_repository.create(db, NotificationRecipientType.ADMIN, admin_id, title, body, type_)
    admin = admin_repository.get_by_id(db, admin_id)
    if admin:
        _dispatch_push(db, NotificationRecipientType.ADMIN, admin.id, title, body, link)
    return notification


def notify_leadership_by_email(subject: str, html_body: str, high_priority: bool = False) -> None:
    """
    Sends a plain email (no in-app record, no push) to the society
    leadership addresses configured in Settings — Chairman, Deputy
    Chairman, Secretary. These are organizational routing addresses, not
    Admin accounts with logins, so this bypasses the in-app/push
    machinery entirely and is not gated by any notification preference
    (organizational routing, not a personal choice).
    """
    settings = get_settings()
    recipients = [
        addr for addr in (settings.chairman_email, settings.deputy_chairman_email, settings.secretary_email)
        if addr
    ]
    if not recipients:
        return
    email_service.send_email(recipients, subject, html_body, high_priority=high_priority)


def notify_emergency_report(subject: str, html_body: str) -> None:
    """
    Ready-to-use but NOT currently called anywhere — there is no
    emergency-report feature in the app yet (no model, no endpoint, no
    resident-facing UI). This exists so whoever builds that feature later
    doesn't also need to build the notification plumbing. Sends to
    support_email as a placeholder until a real emergency-contacts list
    exists.
    """
    settings = get_settings()
    if not settings.support_email:
        return
    email_service.send_email(settings.support_email, subject, html_body, high_priority=True)


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
