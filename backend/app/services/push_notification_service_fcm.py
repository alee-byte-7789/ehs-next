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


def _get_firebase_app() -> firebase_admin.App | None:
    """
    Real bug fixed here: this used to cache "already attempted" even on
    FAILURE, via a separate module-level flag. On Vercel, a serverless
    function instance can stay warm across multiple requests — if the
    very first request to touch this module failed to initialize
    Firebase for any transient reason, every subsequent request on that
    same warm instance would silently never try again, even after the
    credential was fixed. Now only success is cached; a failed attempt
    retries on the next call.
    """
    global _firebase_app

    if _firebase_app is not None:
        return _firebase_app

    settings = get_settings()

    if not settings.firebase_service_account_json:
        logger.info("FIREBASE_SERVICE_ACCOUNT_JSON not set — FCM push disabled.")
        return None

    try:
        cred_dict = json.loads(settings.firebase_service_account_json)
        cred = credentials.Certificate(cred_dict)
        _firebase_app = firebase_admin.initialize_app(cred)
        return _firebase_app
    except ValueError:
        # firebase_admin raises ValueError if an app is already
        # initialized under the default name — happens if this module
        # gets re-imported within the same warm instance. Fetch the
        # existing app instead of treating it as a failure.
        try:
            _firebase_app = firebase_admin.get_app()
            return _firebase_app
        except ValueError as exc:
            logger.warning("Failed to initialize or fetch Firebase Admin app: %s", exc)
            return None
    except Exception as exc:
        logger.warning("Failed to initialize Firebase Admin SDK: %s", exc)
        return None


def send_fcm_push(fcm_token: str | None, title: str, body: str, link: str = "/") -> None:
    if not fcm_token:
        return

    app = _get_firebase_app()
    if app is None:
        return

    try:
        message = messaging.Message(
            notification=messaging.Notification(title=title, body=body),
            token=fcm_token,
            data={"link": link},
            webpush=messaging.WebpushConfig(
                notification=messaging.WebpushNotification(icon="/icons/icon-192.png"),
                fcm_options=messaging.WebpushFCMOptions(link=link),
            ),
        )
        messaging.send(message, app=app)
    except Exception as exc:
        logger.warning("FCM push failed: %s", exc)
