"""Small `/me` endpoints — mainly exist so the auth dependencies have a
protected route to be exercised against in tests. Real profile screens
land properly in Module 4/5."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.v1.deps import get_current_admin, get_current_resident, get_db
from app.models.admin import Admin
from app.models.enums import NotificationRecipientType, PushTokenKind
from app.models.resident import Resident
from app.repositories import push_token_repository
from app.schemas.admin import AdminOut
from app.schemas.push_token import PushTokenRequest
from app.schemas.resident import ResidentOut

router = APIRouter(tags=["me"])


@router.get("/residents/me", response_model=ResidentOut)
def resident_me(resident: Resident = Depends(get_current_resident)) -> ResidentOut:
    return resident


@router.get("/admins/me", response_model=AdminOut)
def admin_me(admin: Admin = Depends(get_current_admin)) -> AdminOut:
    return admin


# These four endpoints now register into the `push_tokens` table (one row
# per device) instead of overwriting a single column on the user row. The
# frontends call them on every app open, so `upsert` refreshes an existing
# device rather than creating duplicates.

@router.post("/residents/me/push-token")
def register_resident_push_token(
    req: PushTokenRequest,
    db: Session = Depends(get_db),
    resident: Resident = Depends(get_current_resident),
) -> dict[str, str]:
    push_token_repository.upsert(
        db, NotificationRecipientType.RESIDENT, resident.id, req.push_token, PushTokenKind.EXPO
    )
    db.commit()
    return {"message": "Push token registered."}


@router.post("/admins/me/push-token")
def register_admin_push_token(
    req: PushTokenRequest,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
) -> dict[str, str]:
    push_token_repository.upsert(
        db, NotificationRecipientType.ADMIN, admin.id, req.push_token, PushTokenKind.EXPO
    )
    db.commit()
    return {"message": "Push token registered."}


@router.post("/residents/me/fcm-token")
def register_resident_fcm_token(
    req: PushTokenRequest,
    db: Session = Depends(get_db),
    resident: Resident = Depends(get_current_resident),
) -> dict[str, str]:
    push_token_repository.upsert(
        db, NotificationRecipientType.RESIDENT, resident.id, req.push_token, PushTokenKind.FCM
    )
    db.commit()
    return {"message": "FCM token registered."}


@router.post("/admins/me/fcm-token")
def register_admin_fcm_token(
    req: PushTokenRequest,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
) -> dict[str, str]:
    push_token_repository.upsert(
        db, NotificationRecipientType.ADMIN, admin.id, req.push_token, PushTokenKind.FCM
    )
    db.commit()
    return {"message": "FCM token registered."}
