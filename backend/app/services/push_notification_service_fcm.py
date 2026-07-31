"""
Firebase Cloud Messaging (web push) sender.

Separate from push_notification_service.py (Expo push, for the native
APK) — this one sends to browsers running the PWA, via Firebase's Admin
SDK. Requires FIREBASE_SERVICE_ACCOUNT_JSON to be set — if it's not set,
every call here silently no-ops rather than raising, so a missing/
misconfigured credential never breaks the underlying action that
triggered a notification.
"""
import json
import logging

import firebase_admin
from firebase_admin import credentials, messaging

from app.core.config import get_settings

logger = logging.getLogger(__name__)

_firebase_app: firebase_admin.App | None = None
_initialization_attempted = False


def _get_firebase_app() -> firebase_admin.App | None:
    global _firebase_app, _initialization_attempted

    if _firebase_app is not None:
        return _firebase_app
    if _initialization_attempted:
        return None

    _initialization_attempted = True
    settings = get_settings()

    if not settings.firebase_service_account_json:
        logger.info("FIREBASE_SERVICE_ACCOUNT_JSON not set — FCM push disabled.")
        return None

    try:
        cred_dict = json.loads(settings.firebase_service_account_json)
        cred = credentials.Certificate(cred_dict)
        _firebase_app = firebase_admin.initialize_app(cred)
        return _firebase_app
    except Exception as exc:
        logger.warning("Failed to initialize Firebase Admin SDK: %s", exc)
        return None


def send_fcm_push(fcm_token: str | None, title: str, body: str) -> None:
    if not fcm_token:
        return

    app = _get_firebase_app()
    if app is None:
        return

    try:
        message = messaging.Message(
            notification=messaging.Notification(title=title, body=body),
            token=fcm_token,
            webpush=messaging.WebpushConfig(
                notification=messaging.WebpushNotification(icon="/icons/icon-192.png")
            ),
        )
        messaging.send(message, app=app)
    except Exception as exc:
        logger.warning("FCM push failed: %s", exc)
