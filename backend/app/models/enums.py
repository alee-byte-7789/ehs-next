"""
Shared enums.

Every fixed set of values used anywhere in the system (DB columns, Pydantic
schemas, API contracts) is defined exactly once here. This prevents the same
concept (e.g. complaint status) from drifting into inconsistent string
literals across the backend and, later, the two frontends.
"""
from enum import Enum


class ResidentType(str, Enum):
    OWNER = "owner"
    TENANT = "tenant"


class VerificationStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class AdminRole(str, Enum):
    HOUSING_OFFICE = "housing_office"
    IT_ADMIN = "it_admin"
    SUPER_ADMIN = "super_admin"
    MAINTENANCE_ADMIN = "maintenance_admin"
    SUPPORT_STAFF = "support_staff"


class StaffCategory(str, Enum):
    ELECTRICIAN = "electrician"
    PLUMBER = "plumber"
    MASON = "mason"
    SECURITY = "security"
    SANITATION = "sanitation"
    OTHER = "other"


class ComplaintCategory(str, Enum):
    GENERAL = "general"
    INFRASTRUCTURE = "infrastructure"
    INTERNAL = "internal"


class ComplaintStatus(str, Enum):
    """
    The full state machine (see PROJECT_ROADMAP.md Section 7):

        PENDING -> ACCEPTED -> ASSIGNED -> IN_PROGRESS -> RESOLVED
                                                              |
                                    +-------------------------+-------------------------+
                                    |                                                    |
                            resident: satisfied                              resident: not satisfied
                                    |                                                    |
                                 CLOSED                                             REOPENED
                                                                                          |
                                                                              admin closes only -> CLOSED
    """
    PENDING = "pending"
    ACCEPTED = "accepted"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"
    REOPENED = "reopened"


class ChangedByType(str, Enum):
    RESIDENT = "resident"
    ADMIN = "admin"
    STAFF = "staff"
    SYSTEM = "system"


class ApplicationFeedbackType(str, Enum):
    FEATURE_REQUEST = "feature_request"
    SUGGESTION = "suggestion"
    BUG_REPORT = "bug_report"


class NotificationRecipientType(str, Enum):
    RESIDENT = "resident"
    ADMIN = "admin"
    STAFF = "staff"


class MosqueName(str, Enum):
    BILAL_MOSQUE = "bilal_mosque"
    MARKAZI_JAMIA_MOSQUE = "markazi_jamia_mosque"


class ComplaintPriority(str, Enum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    CRITICAL = "critical"


class NotificationPreference(str, Enum):
    """Future-proofing per the email notification spec: even before a
    Settings UI exists to change this, the architecture supports it —
    every notification-sending call site checks this before sending
    push/email."""
    PUSH_AND_EMAIL = "push_and_email"
    PUSH_ONLY = "push_only"
    EMAIL_ONLY = "email_only"
    NONE = "none"
