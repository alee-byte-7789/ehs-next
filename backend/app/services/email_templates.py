"""
Reusable HTML email templates with EHS Next branding.

Every specific template is built from three shared pieces —
`_base_template`, `_detail_row`/`_detail_table`, `_action_button` — so
branding/layout changes happen in ONE place, not once per template.

The logo is referenced by absolute URL (the deployed PWA's own icon),
since email clients strip relative paths and can't reach bundled app
assets — this only works because that PWA is already publicly deployed.
"""
from datetime import datetime

_LOGO_URL = "https://ehsnext.vercel.app/icons/icon-512.png"
_ADMIN_PORTAL_URL = "https://ehs-next-admin.vercel.app"
_PWA_URL = "https://ehsnext.vercel.app"

_PRIMARY = "#10B981"
_SECONDARY = "#1E3A5F"
_TEXT = "#111827"
_MUTED = "#6B7280"
_BORDER = "#E5E7EB"


def _base_template(title: str, body_html: str) -> str:
    return f"""\
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0; padding:0; background-color:#F5F6F7; font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F6F7; padding:24px 0;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background-color:#FFFFFF; border-radius:12px; overflow:hidden; border:1px solid {_BORDER};">
        <tr>
          <td style="background-color:{_SECONDARY}; padding:20px 24px; text-align:center;">
            <img src="{_LOGO_URL}" alt="EHS Next" width="40" height="40" style="display:inline-block;" />
            <div style="color:#FFFFFF; font-size:16px; font-weight:700; margin-top:8px;">EHS Next</div>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 24px;">
            <h2 style="margin:0 0 16px 0; color:{_TEXT}; font-size:20px;">{title}</h2>
            {body_html}
          </td>
        </tr>
        <tr>
          <td style="padding:16px 24px; background-color:#F5F6F7; border-top:1px solid {_BORDER};">
            <p style="margin:0; color:{_MUTED}; font-size:12px; line-height:18px;">
              Employees Housing Society (EHS) — Committed to Serve.<br/>
              This is an automated message from EHS Next. Please do not reply directly to this email.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""


def _detail_row(label: str, value: str) -> str:
    return f"""\
<tr>
  <td style="padding:6px 0; color:{_MUTED}; font-size:13px; width:140px; vertical-align:top;">{label}</td>
  <td style="padding:6px 0; color:{_TEXT}; font-size:13px; font-weight:600; vertical-align:top;">{value}</td>
</tr>"""


def _detail_table(rows: list[tuple[str, str]]) -> str:
    rows_html = "".join(_detail_row(label, value) for label, value in rows)
    return f'<table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">{rows_html}</table>'


def _action_button(url: str, label: str) -> str:
    return f"""\
<table cellpadding="0" cellspacing="0" style="margin-top:20px;">
  <tr><td style="background-color:{_PRIMARY}; border-radius:8px;">
    <a href="{url}" style="display:inline-block; padding:12px 24px; color:#FFFFFF; font-size:14px; font-weight:600; text-decoration:none;">{label}</a>
  </td></tr>
</table>"""


def _now_str() -> str:
    return datetime.now().strftime("%b %d, %Y at %I:%M %p")


# --- Event-specific templates ---

def new_complaint_email(
    complaint_code: str, resident_name: str, house_code: str,
    category: str, subcategory: str, priority: str, description: str,
) -> tuple[str, str]:
    subject = f"New Complaint Received - {complaint_code}"
    body = f"""\
<p style="color:{_TEXT}; font-size:14px; line-height:20px;">
  A new complaint has been submitted and needs review.
</p>
{_detail_table([
    ("Complaint ID", complaint_code),
    ("Resident", resident_name),
    ("House Number", house_code),
    ("Category", f"{category} — {subcategory}"),
    ("Priority", priority.upper()),
    ("Submitted", _now_str()),
])}
<p style="color:{_TEXT}; font-size:13px; line-height:20px; margin-top:16px;">{description}</p>
{_action_button(f"{_ADMIN_PORTAL_URL}/complaints/{complaint_code}", "Open in Admin Portal")}
"""
    return subject, _base_template("New Complaint Received", body)


def complaint_assigned_email(
    complaint_code: str, assigned_department: str, status: str,
) -> tuple[str, str]:
    subject = "Your Complaint Has Been Assigned"
    body = f"""\
<p style="color:{_TEXT}; font-size:14px; line-height:20px;">
  Good news — your complaint is now being handled.
</p>
{_detail_table([
    ("Complaint ID", complaint_code),
    ("Assigned To", assigned_department),
    ("Current Status", status.replace("_", " ").title()),
])}
{_action_button(f"{_PWA_URL}/complaints", "View My Complaints")}
"""
    return subject, _base_template("Complaint Assigned", body)


_STATUS_EXPLANATIONS = {
    "pending": "Your complaint has been received and is awaiting review.",
    "accepted": "Your complaint has been accepted and will be assigned shortly.",
    "assigned": "Your complaint has been assigned to a staff member.",
    "in_progress": "Work on your complaint is currently in progress.",
    "resolved": "Your complaint has been marked as resolved.",
    "closed": "Your complaint has been closed.",
    "reopened": "Your complaint has been reopened for further review.",
}


def complaint_status_changed_email(complaint_code: str, new_status: str) -> tuple[str, str]:
    status_label = new_status.replace("_", " ").title()
    subject = f"Complaint Status Updated - {complaint_code}"
    explanation = _STATUS_EXPLANATIONS.get(new_status, "Your complaint's status has been updated.")
    body = f"""\
<p style="color:{_TEXT}; font-size:14px; line-height:20px;">{explanation}</p>
{_detail_table([
    ("Complaint ID", complaint_code),
    ("New Status", status_label),
    ("Updated", _now_str()),
])}
{_action_button(f"{_PWA_URL}/complaints", "View Complaint")}
"""
    return subject, _base_template("Complaint Status Updated", body)


def complaint_resolved_email(complaint_code: str) -> tuple[str, str]:
    subject = "Your Complaint Has Been Resolved"
    body = f"""\
<p style="color:{_TEXT}; font-size:14px; line-height:20px;">
  Your complaint has been marked as resolved. If the issue is fully fixed, no further action is
  needed — but if you're not satisfied, you can reopen it from the app.
</p>
{_detail_table([
    ("Complaint ID", complaint_code),
    ("Resolved On", _now_str()),
])}
{_action_button(f"{_PWA_URL}/complaints", "Leave Feedback")}
"""
    return subject, _base_template("Complaint Resolved", body)


def complaint_reopened_email(
    complaint_code: str, resident_name: str, house_code: str, original_description: str,
) -> tuple[str, str]:
    subject = "Complaint Reopened"
    body = f"""\
<p style="color:{_TEXT}; font-size:14px; line-height:20px;">
  A resident was not satisfied with the resolution and has reopened their complaint.
</p>
{_detail_table([
    ("Complaint ID", complaint_code),
    ("Resident", resident_name),
    ("House Number", house_code),
    ("Reopened", _now_str()),
])}
<p style="color:{_TEXT}; font-size:13px; line-height:20px; margin-top:12px;"><em>Original complaint:</em> {original_description}</p>
{_action_button(f"{_ADMIN_PORTAL_URL}/complaints/{complaint_code}", "Review in Admin Portal")}
"""
    return subject, _base_template("Complaint Reopened", body)


def registration_approved_email(resident_name: str, resident_code: str) -> tuple[str, str]:
    subject = "Your EHS Next Account Has Been Approved"
    body = f"""\
<p style="color:{_TEXT}; font-size:14px; line-height:20px;">
  Hi {resident_name}, your registration has been approved. You can now log in and start using
  EHS Next to raise complaints, track their progress, and stay informed about society matters.
</p>
{_detail_table([("Resident ID", resident_code)])}
{_action_button(f"{_PWA_URL}/login", "Log In Now")}
"""
    return subject, _base_template("Welcome to EHS Next", body)


def emergency_alert_email(
    reporter_name: str, house_code: str, emergency_type: str, description: str,
) -> tuple[str, str]:
    """
    NOTE: no feature in the app currently submits an emergency report —
    there's no model, endpoint, or resident-facing UI for this yet. This
    template and its caller (notify_emergency_report in
    notification_service.py) exist ready to be wired up once that feature
    is actually built. Do not assume this fires today.
    """
    subject = "🚨 Emergency Alert"
    body = f"""\
<p style="color:#B91C1C; font-size:14px; font-weight:700; line-height:20px;">
  An emergency has been reported and requires immediate attention.
</p>
{_detail_table([
    ("Reported By", reporter_name),
    ("House Number", house_code),
    ("Type", emergency_type),
    ("Time", _now_str()),
])}
<p style="color:{_TEXT}; font-size:13px; line-height:20px; margin-top:12px;">{description}</p>
"""
    return subject, _base_template("Emergency Alert", body)
