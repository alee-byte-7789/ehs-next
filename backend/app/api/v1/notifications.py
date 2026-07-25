"""Notification endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.v1.deps import get_current_admin, get_current_resident, get_db
from app.models.admin import Admin
from app.models.enums import NotificationRecipientType
from app.models.resident import Resident
from app.schemas.notification import NotificationOut
from app.services import notification_service
from app.services.errors import NotFoundError

router = APIRouter(prefix="/notifications", tags=["notifications"])


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
