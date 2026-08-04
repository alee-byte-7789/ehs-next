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


def send_push(push_token: str | None, title: str, body: str, link: str = "/home") -> None:
    if not push_token:
        return
    if not push_token.startswith("ExponentPushToken"):
        return

    try:
        response = httpx.post(
            _EXPO_PUSH_URL,
            json={"to": push_token, "title": title, "body": body, "sound": "default", "data": {"link": link}},
            headers={"Content-Type": "application/json"},
            timeout=5.0,
        )
        if response.status_code != 200:
            logger.warning("Expo push failed (%s): %s", response.status_code, response.text)
    except httpx.HTTPError as exc:
        logger.warning("Expo push request failed: %s", exc)
