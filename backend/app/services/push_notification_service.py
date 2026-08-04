"""
Expo push notification sender.

Uses Expo's own push notification service (https://exp.host/--/api/v2/push/send)
rather than calling Firebase Cloud Messaging directly — Expo's service
internally handles delivery to both Android (via FCM) and iOS (via APNs)
using Expo's own default credentials, so no Firebase project setup is
needed for this basic implementation. This only works for the native app
built via EAS Build — browsers (the PWA) cannot register a token this way.

Failures here are deliberately swallowed (logged, not raised) — a failed
push should never break the underlying action that triggered it.
"""
import logging

import httpx

logger = logging.getLogger(__name__)

_EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"


def send_push(push_token: str | None, title: str, body: str, link: str = "/home") -> dict:
    """
    Returns a structured result mirroring send_fcm_push, including a
    `token_invalid` flag so callers can clear dead tokens.

    Note Expo reports an unusable token INSIDE a 200 response body
    (data.status == "error", details.error == "DeviceNotRegistered")
    rather than as an HTTP error status — so this previously went
    completely unnoticed and dead tokens were retried forever.
    """
    if not push_token:
        return {"stage": "token_check", "success": False, "error": "No Expo push token provided."}
    if not push_token.startswith("ExponentPushToken"):
        return {"stage": "token_check", "success": False, "error": "Not an Expo push token."}

    try:
        response = httpx.post(
            _EXPO_PUSH_URL,
            json={"to": push_token, "title": title, "body": body, "sound": "default", "data": {"link": link}},
            headers={"Content-Type": "application/json"},
            timeout=5.0,
        )
        if response.status_code != 200:
            logger.warning("[X] Expo push failed (%s): %s", response.status_code, response.text)
            return {"stage": "send", "success": False, "error": f"HTTP {response.status_code}: {response.text}"}

        payload = response.json().get("data", {})
        if payload.get("status") == "error":
            error_code = (payload.get("details") or {}).get("error")
            if error_code == "DeviceNotRegistered":
                logger.info("[X] Expo token no longer registered — will be cleared.")
                return {"stage": "send", "success": False, "error": "DeviceNotRegistered", "token_invalid": True}
            logger.warning("[X] Expo push rejected: %s", payload)
            return {"stage": "send", "success": False, "error": str(payload)}

        logger.info("[OK] Expo push accepted.")
        return {"stage": "sent", "success": True, "expo_response": payload}
    except httpx.HTTPError as exc:
        logger.warning("[X] Expo push request failed: %s", exc)
        return {"stage": "send", "success": False, "error": str(exc)}
