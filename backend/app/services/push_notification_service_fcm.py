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
        logger.warning("[X] FIREBASE_SERVICE_ACCOUNT_JSON not set — FCM push disabled.")
        return None

    try:
        cred_dict = json.loads(settings.firebase_service_account_json)
        cred = credentials.Certificate(cred_dict)
        _firebase_app = firebase_admin.initialize_app(cred)
        logger.info("[OK] Firebase Admin SDK initialized (project: %s)", cred_dict.get("project_id"))
        return _firebase_app
    except json.JSONDecodeError as exc:
        logger.warning("[X] FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON: %s", exc)
        return None
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


def send_fcm_push(fcm_token: str | None, title: str, body: str, link: str = "/") -> dict:
    """
    Returns a result dict describing exactly what happened at each stage
    — used directly by the /test-notification endpoint so the actual
    Firebase response (or exact failure reason) reaches the frontend,
    not just a silent success/failure.
    """
    if not fcm_token:
        logger.warning("[X] No FCM token provided — cannot send.")
        return {"stage": "token_check", "success": False, "error": "No FCM token provided."}

    logger.info("[i] Attempting to initialize Firebase Admin SDK...")
    app = _get_firebase_app()
    if app is None:
        logger.warning("[X] Firebase Admin SDK not initialized — check FIREBASE_SERVICE_ACCOUNT_JSON.")
        return {
            "stage": "firebase_init",
            "success": False,
            "error": "Firebase Admin SDK not initialized — FIREBASE_SERVICE_ACCOUNT_JSON is missing or invalid.",
        }
    logger.info("[OK] Firebase initialized.")

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
        logger.info("[i] Sending message to Firebase...")
        response = messaging.send(message, app=app)
        logger.info("[OK] Firebase response: %s", response)
        return {"stage": "sent", "success": True, "firebase_response": response}
    except messaging.UnregisteredError as exc:
        # The token is real but no longer valid — the user cleared their
        # browser data, uninstalled the PWA, revoked permission, or the
        # token simply rotated. Flagged distinctly from other errors so
        # the caller can DELETE it rather than retrying a dead token on
        # every future notification forever.
        logger.info("[X] FCM token is no longer registered — will be cleared: %s", exc)
        return {"stage": "send", "success": False, "error": f"Token unregistered: {exc}", "token_invalid": True}
    except Exception as exc:
        logger.warning("[X] FCM push failed at send stage: %s: %s", type(exc).__name__, exc)
        return {"stage": "send", "success": False, "error": f"{type(exc).__name__}: {exc}"}
