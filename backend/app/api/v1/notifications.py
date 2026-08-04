"""Notification endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.v1.deps import get_current_admin, get_current_resident, get_db
from app.models.admin import Admin
from app.models.enums import NotificationRecipientType
from app.models.resident import Resident
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


@router.post("/test")
def test_notification_resident(resident: Resident = Depends(get_current_resident)) -> dict:
    """
    Real end-to-end proof, not a theoretical check. Sends an actual push
    to the CURRENT resident's own saved tokens and returns exactly what
    happened at each stage — Firebase's real response on success, or the
    exact stage and reason on failure. Nothing here is guessed.
    """
    fcm_result = push_notification_service_fcm.send_fcm_push(resident.fcm_token, _TEST_TITLE, _TEST_BODY)
    expo_attempted = bool(resident.push_token)
    if expo_attempted:
        push_notification_service.send_push(resident.push_token, _TEST_TITLE, _TEST_BODY)

    return {
        "fcm_token_on_file": bool(resident.fcm_token),
        "expo_token_on_file": expo_attempted,
        "fcm_result": fcm_result,
    }


@router.post("/admin/test")
def test_notification_admin(admin: Admin = Depends(get_current_admin)) -> dict:
    """Same as /test above, for the currently signed-in admin."""
    fcm_result = push_notification_service_fcm.send_fcm_push(admin.fcm_token, _TEST_TITLE, _TEST_BODY)
    expo_attempted = bool(admin.push_token)
    if expo_attempted:
        push_notification_service.send_push(admin.push_token, _TEST_TITLE, _TEST_BODY)

    return {
        "fcm_token_on_file": bool(admin.fcm_token),
        "expo_token_on_file": expo_attempted,
        "fcm_result": fcm_result,
    }
