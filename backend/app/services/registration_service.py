"""
Registration approval service.

This is the ONLY place `resident_code` gets assigned, and it only runs
after an admin approves — enforcing Section 6.3's "server-side only, after
Housing Office approval" rule.
"""
from sqlalchemy.orm import Session

from app.models.admin import Admin
from app.models.enums import ResidentType, VerificationStatus
from app.models.resident import Resident
from app.repositories import house_repository, registration_approval_repository, resident_repository
from app.services import email_templates, notification_service
from app.services.errors import ConflictError, InvalidStateError, NotFoundError
from app.services.id_generation import owner_resident_code, tenant_resident_code


def list_pending(db: Session) -> list[Resident]:
    return resident_repository.list_pending(db)


def approve(db: Session, resident_id: int, acting_admin: Admin) -> Resident:
    resident = resident_repository.get_by_id(db, resident_id)
    if not resident:
        raise NotFoundError(f"No resident with id {resident_id}.")
    if resident.verification_status != VerificationStatus.PENDING:
        raise InvalidStateError(
            f"Resident {resident_id} is '{resident.verification_status.value}', not pending."
        )

    house = house_repository.get_by_id(db, resident.house_id)
    if not house:
        raise NotFoundError(f"House {resident.house_id} for resident {resident_id} not found.")

    if resident.resident_type == ResidentType.OWNER:
        if resident_repository.has_approved_owner(db, house.id):
            raise ConflictError(f"House {house.house_code} already has an approved owner.")
        resident.resident_code = owner_resident_code(house.house_code)
    else:
        sequence = resident_repository.next_tenant_sequence(db, house.id)
        resident.tenant_sequence = sequence
        resident.resident_code = tenant_resident_code(house.house_code, sequence)

    resident.verification_status = VerificationStatus.APPROVED

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
    )

    db.commit()
    db.refresh(resident)

    subject, html = email_templates.registration_approved_email(resident.full_name, resident.resident_code)
    notification_service.notify_resident(
        db, resident.id,
        title="Your account has been approved",
        body="You can now log in and start using EHS Next.",
        type_="registration_approved",
        email_content=(subject, html),
    )
    db.commit()  # notify_resident's notification insert is flushed, not committed — this closes that gap
    return resident


def reject(db: Session, resident_id: int, acting_admin: Admin) -> Resident:
    resident = resident_repository.get_by_id(db, resident_id)
    if not resident:
        raise NotFoundError(f"No resident with id {resident_id}.")
    if resident.verification_status != VerificationStatus.PENDING:
        raise InvalidStateError(
            f"Resident {resident_id} is '{resident.verification_status.value}', not pending."
        )

    resident.verification_status = VerificationStatus.REJECTED

    registration_approval_repository.record(
        db,
        resident_id=resident.id,
        house_id=resident.house_id,
        resident_name=resident.full_name,
        house_code=resident.house_code,
        resident_type=resident.resident_type,
        resident_code=resident.resident_code,
        decision=VerificationStatus.REJECTED,
        decided_by_admin_id=acting_admin.id,
        decided_by_admin_name=acting_admin.full_name,
    )

    db.commit()
    db.refresh(resident)
    return resident
