"""
Admin-initiated account management.

Four privileged flows live here: resetting a resident's password, deleting
a registration, creating a resident manually, and resetting another admin's
password.

Two rules hold across all of them:

1. Passwords are only ever stored as bcrypt hashes, via
   `app.core.security.hash_password`. No plaintext is written to the
   database, returned in a response, or put in an audit row — audit
   `details` records THAT a reset happened, never the value.

2. Every action writes an audit row inside the SAME transaction as the
   change itself. A password reset that succeeded but left no trace of who
   did it would be worse than one that failed outright, so the two commit
   together or not at all.

RBAC is enforced at the route layer (see api/v1), not here, matching how
the rest of this codebase separates those concerns.
"""
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.admin import Admin
from app.models.enums import ResidentType, VerificationStatus
from app.models.resident import Resident
from app.repositories import (
    admin_repository,
    house_repository,
    registration_approval_repository,
    resident_repository,
)
from app.schemas.admin_actions import ManualRegisterRequest
from app.services import audit_log_service
from app.services.errors import ConflictError, InvalidStateError, NotFoundError
from app.services.id_generation import build_house_code, owner_resident_code, tenant_resident_code


# --------------------------------------------------------------------------
# Resident password reset
# --------------------------------------------------------------------------
def reset_resident_password(
    db: Session, resident_id: int, new_password: str, acting_admin: Admin
) -> Resident:
    """Sets a new password for a resident who has forgotten theirs.

    The old password is neither required nor consulted — that is the entire
    point. Authority comes from the acting admin's role, checked by the
    route's RBAC dependency before this is reached.
    """
    resident = resident_repository.get_by_id(db, resident_id)
    if not resident:
        raise NotFoundError(f"No resident with id {resident_id}.")

    resident.password_hash = hash_password(new_password)

    # Existing refresh tokens are deliberately left alone rather than
    # revoked: this flow is "the resident forgot their password", not "the
    # account is compromised". Forcing every device to sign out would make
    # a routine helpdesk action feel like a security incident. If a
    # compromise flow is ever needed it should revoke explicitly.
    audit_log_service.log(
        db, acting_admin.id, "reset_resident_password", "resident", resident.id,
        details=f"target={resident.full_name} ({resident.phone})",
    )
    db.commit()
    db.refresh(resident)
    return resident


# --------------------------------------------------------------------------
# Registration deletion
# --------------------------------------------------------------------------
def delete_registration(
    db: Session, resident_id: int, reason: str, acting_admin: Admin, force: bool = False
) -> str:
    """Permanently removes a resident.

    Safe by default: refuses if the resident has real activity (complaints
    or feedback), because deleting underneath those rows destroys history
    the housing office may still need.

    `force=True` overrides that and removes everything belonging to them —
    complaints, complaint history, internal notes, feedback, notifications,
    tokens. Required for genuine removals (a resident who has moved out),
    but the caller must ask for it explicitly, and the UI shows exactly how
    much history will be destroyed before the admin confirms.

    Either way the audit row records what was removed and why, and survives
    the deletion.
    """
    resident = resident_repository.get_by_id(db, resident_id)
    if not resident:
        raise NotFoundError(f"No resident with id {resident_id}.")

    complaint_count = _count_complaints(db, resident_id)
    feedback_count = _count_feedback(db, resident_id)

    if (complaint_count or feedback_count) and not force:
        raise InvalidStateError(
            f"{resident.full_name} has {complaint_count} complaint(s) and "
            f"{feedback_count} feedback entry(s) on record. Confirm removal to delete "
            "them as well, or reject the registration instead to keep the history."
        )

    label = f"{resident.full_name} ({resident.phone}) house={resident.house_code}"

    # Written BEFORE the delete, while the resident still exists to be
    # described. audit_logs.entity_id is a plain integer, not a foreign key,
    # so this record outlives the row it refers to.
    audit_log_service.log(
        db, acting_admin.id, "delete_registration", "resident", resident.id,
        details=f"{label} | status={resident.verification_status.value} | "
                f"complaints_deleted={complaint_count} feedback_deleted={feedback_count} | "
                f"reason={reason}",
    )

    if complaint_count or feedback_count:
        _delete_activity_rows(db, resident_id)
    _delete_dependent_rows(db, resident_id)
    db.delete(resident)
    db.commit()

    if complaint_count or feedback_count:
        return f"{label}, along with {complaint_count} complaint(s) and {feedback_count} feedback entry(s)"
    return label


def _delete_activity_rows(db: Session, resident_id: int) -> None:
    """Removes a resident's complaints and feedback, children first.

    Complaint history and internal notes reference complaints, so they must
    go before the complaints themselves or the delete violates a foreign key.
    """
    from app.models.application_feedback import ApplicationFeedback
    from app.models.complaint import Complaint
    from app.models.complaint_history import ComplaintHistory
    from app.models.complaint_internal_note import ComplaintInternalNote
    from app.models.feedback import Feedback

    complaint_ids = [c.id for c in db.query(Complaint).filter(Complaint.resident_id == resident_id).all()]

    if complaint_ids:
        db.query(ComplaintInternalNote).filter(
            ComplaintInternalNote.complaint_id.in_(complaint_ids)
        ).delete(synchronize_session=False)
        db.query(ComplaintHistory).filter(
            ComplaintHistory.complaint_id.in_(complaint_ids)
        ).delete(synchronize_session=False)
        db.query(Feedback).filter(
            Feedback.complaint_id.in_(complaint_ids)
        ).delete(synchronize_session=False)

    db.query(Feedback).filter(Feedback.resident_id == resident_id).delete(synchronize_session=False)
    db.query(ApplicationFeedback).filter(
        ApplicationFeedback.resident_id == resident_id
    ).delete(synchronize_session=False)
    db.query(Complaint).filter(Complaint.resident_id == resident_id).delete(synchronize_session=False)
    db.flush()


def _count_complaints(db: Session, resident_id: int) -> int:
    from app.models.complaint import Complaint
    return db.query(Complaint).filter(Complaint.resident_id == resident_id).count()


def _count_feedback(db: Session, resident_id: int) -> int:
    from app.models.application_feedback import ApplicationFeedback
    from app.models.feedback import Feedback
    return (
        db.query(Feedback).filter(Feedback.resident_id == resident_id).count()
        + db.query(ApplicationFeedback).filter(ApplicationFeedback.resident_id == resident_id).count()
    )


def _delete_dependent_rows(db: Session, resident_id: int) -> None:
    """Clears rows that reference this resident but carry no history worth
    keeping once the registration itself is gone."""
    from app.models.enums import NotificationRecipientType
    from app.models.notification import Notification
    from app.models.push_token import PushToken
    from app.core.security import SubjectType
    from app.models.refresh_token import RefreshToken
    from app.models.registration_approval import RegistrationApproval

    db.query(RegistrationApproval).filter(RegistrationApproval.resident_id == resident_id).delete()
    db.query(RefreshToken).filter(
        RefreshToken.subject_type == SubjectType.RESIDENT,
        RefreshToken.subject_id == resident_id,
    ).delete()
    db.query(PushToken).filter(
        PushToken.owner_type == NotificationRecipientType.RESIDENT,
        PushToken.owner_id == resident_id,
    ).delete()
    db.query(Notification).filter(
        Notification.recipient_type == NotificationRecipientType.RESIDENT,
        Notification.recipient_id == resident_id,
    ).delete()
    db.flush()


# --------------------------------------------------------------------------
# Manual registration
# --------------------------------------------------------------------------
def manual_register(db: Session, req: ManualRegisterRequest, acting_admin: Admin) -> Resident:
    """Creates a resident on an admin's behalf, already approved.

    Runs the same uniqueness checks as self-registration — an admin adding
    someone by hand must not be able to create a duplicate phone or CNIC
    that the public form would have rejected.
    """
    if resident_repository.phone_or_email_taken(db, req.mobile_number, req.email):
        raise ConflictError("A resident with this phone or email is already registered.")
    if resident_repository.cnic_taken(db, req.cnic):
        raise ConflictError("A resident with this CNIC is already registered.")

    house_code, block = build_house_code(req.house_number)
    house = house_repository.get_or_create(db, house_code=house_code, block=block)

    resident = Resident(
        house_id=house.id,
        full_name=req.full_name,
        phone=req.mobile_number,
        email=req.email,
        password_hash=hash_password(req.password),
        cnic=req.cnic,
        resident_type=req.resident_type,
        owner_name=req.owner_name,
        owner_cnic=req.owner_cnic,
        owner_phone=req.owner_mobile_number,
        verification_status=VerificationStatus.APPROVED,
    )

    # Same resident-code rules as registration_service.approve, so a manual
    # entry is indistinguishable from an approved self-registration.
    if resident.resident_type == ResidentType.OWNER:
        if resident_repository.has_approved_owner(db, house.id):
            raise ConflictError(f"House {house.house_code} already has an approved owner.")
        resident.resident_code = owner_resident_code(house.house_code)
    else:
        sequence = resident_repository.next_tenant_sequence(db, house.id)
        resident.tenant_sequence = sequence
        resident.resident_code = tenant_resident_code(house.house_code, sequence)

    db.add(resident)
    db.flush()

    registration_approval_repository.record(
        db,
        resident_id=resident.id,
        house_id=house.id,
        resident_name=resident.full_name,
        house_code=house.house_code,
        resident_type=resident.resident_type,
        resident_code=resident.resident_code,
        decision=VerificationStatus.APPROVED,
        decided_by_admin_id=acting_admin.id,
        decided_by_admin_name=acting_admin.full_name,
        reason="Created manually by admin",
    )
    audit_log_service.log(
        db, acting_admin.id, "manual_register_resident", "resident", resident.id,
        details=f"{resident.full_name} ({resident.phone}) house={house.house_code} "
                f"type={resident.resident_type.value} code={resident.resident_code}",
    )
    db.commit()
    db.refresh(resident)
    return resident


# --------------------------------------------------------------------------
# Admin password reset
# --------------------------------------------------------------------------
def reset_admin_password(
    db: Session, target_admin_id: int, new_password: str, acting_admin: Admin
) -> Admin:
    """Resets another admin's password. Route RBAC restricts this to Super
    Admins; the one extra rule enforced here is that it must be *another*
    admin."""
    target = admin_repository.get_by_id(db, target_admin_id)
    if not target:
        raise NotFoundError(f"No admin with id {target_admin_id}.")

    if target.id == acting_admin.id:
        # Not a security boundary, a clarity one: "reset someone's password"
        # and "change my own password" are different operations with
        # different audit meanings, and conflating them makes the log
        # ambiguous.
        raise InvalidStateError(
            "Use the change-password flow for your own account, not the admin reset."
        )

    target.password_hash = hash_password(new_password)
    audit_log_service.log(
        db, acting_admin.id, "reset_admin_password", "admin", target.id,
        details=f"target={target.full_name} ({target.email}) role={target.role.value}",
    )
    db.commit()
    db.refresh(target)
    return target
