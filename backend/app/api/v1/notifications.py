"""Notification endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.v1.deps import get_current_admin, get_current_resident, get_db
from app.models.admin import Admin
from app.models.enums import NotificationRecipientType, PushTokenKind
from app.models.resident import Resident
from app.repositories import push_token_repository
from app.schemas.notification import NotificationOut
from app.services import notification_service, push_notification_service, push_notification_service_fcm
from app.services.errors import NotFoundError

router = APIRouter(prefix="/notifications", tags=["notifications"])

_TEST_TITLE = "EHS Next Test"
_TEST_BODY = "If you can see this notification, Firebase Cloud Messaging is working successfully."


@router.get("/mine", response_model=list[NotificationOut])
def list_my_notifications_resident(
    db: Session = Depends(get_db),
    resident: Resident = Depends(get_current_resident),
) -> list[NotificationOut]:
    return notification_service.list_my_notifications(db, NotificationRecipientType.RESIDENT, resident.id)


@router.get("/mine/unread-count")
def unread_count_resident(
    db: Session = Depends(get_db),
    resident: Resident = Depends(get_current_resident),
) -> dict[str, int]:
    return {"count": notification_service.unread_count(db, NotificationRecipientType.RESIDENT, resident.id)}


@router.post("/{notification_id}/read", response_model=NotificationOut)
def mark_read_resident(
    notification_id: int,
    db: Session = Depends(get_db),
    resident: Resident = Depends(get_current_resident),
) -> NotificationOut:
    try:
        return notification_service.mark_read(db, NotificationRecipientType.RESIDENT, resident.id, notification_id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.get("/admin/mine", response_model=list[NotificationOut])
def list_my_notifications_admin(
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
) -> list[NotificationOut]:
    return notification_service.list_my_notifications(db, NotificationRecipientType.ADMIN, admin.id)


@router.get("/admin/mine/unread-count")
def unread_count_admin(
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
) -> dict[str, int]:
    return {"count": notification_service.unread_count(db, NotificationRecipientType.ADMIN, admin.id)}


@router.post("/admin/{notification_id}/read", response_model=NotificationOut)
def mark_read_admin(
    notification_id: int,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
) -> NotificationOut:
    try:
        return notification_service.mark_read(db, NotificationRecipientType.ADMIN, admin.id, notification_id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


def _run_push_test(db: Session, owner_type: NotificationRecipientType, owner_id: int) -> dict:
    """
    Real end-to-end proof, not a theoretical check: sends an actual push to
    EVERY device registered to this account and reports what happened for
    each one individually — Firebase/Expo's real response on success, or
    the exact stage and reason on failure.

    Per-device reporting matters now that one account can have several
    devices: "it works on my PC but not my phone" is answerable directly
    from this output instead of guesswork.
    """
    tokens = push_token_repository.list_for_owner(db, owner_type, owner_id)
    if not tokens:
        return {
            "devices_registered": 0,
            "results": [],
            "hint": "No devices registered. Open the app on the device, grant notification permission, then retry.",
        }

    results = []
    for entry in tokens:
        if entry.kind == PushTokenKind.EXPO:
            outcome = push_notification_service.send_push(entry.token, _TEST_TITLE, _TEST_BODY)
        else:
            outcome = push_notification_service_fcm.send_fcm_push(entry.token, _TEST_TITLE, _TEST_BODY)
        results.append({
            "kind": entry.kind.value,
            "token_preview": entry.token[:18] + "...",
            "last_seen_at": entry.last_seen_at.isoformat() if entry.last_seen_at else None,
            "outcome": outcome,
        })

    return {
        "devices_registered": len(tokens),
        "delivered_to": sum(1 for r in results if r["outcome"].get("success")),
        "results": results,
    }


@router.post("/test")
def test_notification_resident(
    db: Session = Depends(get_db),
    resident: Resident = Depends(get_current_resident),
) -> dict:
    return _run_push_test(db, NotificationRecipientType.RESIDENT, resident.id)


@router.post("/admin/test")
def test_notification_admin(
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
) -> dict:
    return _run_push_test(db, NotificationRecipientType.ADMIN, admin.id)
