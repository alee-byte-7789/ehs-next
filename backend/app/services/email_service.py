"""
Email service — the ONLY place in the codebase that talks to Zoho Mail's
SMTP server. Every other module renders an HTML template and calls
`send_email()`; nothing else touches smtplib directly.

Design choices, explained:
- SMTP over Zoho's official API: simpler, no OAuth app registration
  needed, and Python's stdlib smtplib/email cover everything required.
- Synchronous, not aiosmtplib: every other service in this codebase
  (push_notification_service, push_notification_service_fcm, the whole
  SQLAlchemy layer) is synchronous, and this app runs as sync Vercel
  functions with no running event loop — sync-with-retry is the
  consistent, correct choice here, not a shortcut.
- Never raises: a Zoho outage or bad credential must never break the
  underlying action that triggered a notification — same defensive
  contract as the push services.
"""
import logging
import smtplib
import ssl
import time
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import get_settings

logger = logging.getLogger(__name__)

_MAX_ATTEMPTS = 3
_RETRY_DELAY_SECONDS = 2


def send_email(
    to: str | list[str],
    subject: str,
    html_body: str,
    high_priority: bool = False,
) -> bool:
    """
    Sends one HTML email. Returns True/False for success — never raises.
    Silently no-ops if Zoho credentials aren't configured.
    """
    settings = get_settings()

    if not settings.zoho_smtp_user or not settings.zoho_smtp_password:
        logger.info("Zoho SMTP credentials not configured — email send skipped: %s", subject)
        return False

    recipients = [to] if isinstance(to, str) else to
    if not recipients:
        logger.warning("send_email called with no recipients: %s", subject)
        return False

    sender_email = settings.zoho_sender_email or settings.zoho_smtp_user

    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = f"{settings.zoho_sender_name} <{sender_email}>"
    message["To"] = ", ".join(recipients)
    if high_priority:
        message["X-Priority"] = "1"
        message["Importance"] = "High"
    message.attach(MIMEText(html_body, "html"))

    last_error: Exception | None = None
    for attempt in range(1, _MAX_ATTEMPTS + 1):
        try:
            context = ssl.create_default_context()
            with smtplib.SMTP_SSL(
                settings.zoho_smtp_host, settings.zoho_smtp_port, context=context, timeout=10
            ) as server:
                server.login(settings.zoho_smtp_user, settings.zoho_smtp_password)
                server.sendmail(sender_email, recipients, message.as_string())

            logger.info(
                "Email sent successfully (attempt %d/%d): '%s' to %s",
                attempt, _MAX_ATTEMPTS, subject, recipients,
            )
            return True

        except Exception as exc:
            last_error = exc
            logger.warning(
                "Email send attempt %d/%d failed for '%s' to %s: %s",
                attempt, _MAX_ATTEMPTS, subject, recipients, exc,
            )
            if attempt < _MAX_ATTEMPTS:
                time.sleep(_RETRY_DELAY_SECONDS)

    logger.error(
        "Email send FAILED after %d attempts: '%s' to %s — last error: %s",
        _MAX_ATTEMPTS, subject, recipients, last_error,
    )
    return False
