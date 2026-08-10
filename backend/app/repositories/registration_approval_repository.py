"""Registration approval repository — plain DB access, append-only."""
from sqlalchemy.orm import Session

from app.models.enums import ResidentType, VerificationStatus
from app.models.registration_approval import RegistrationApproval


def record(
    db: Session,
    *,
    resident_id: int,
    house_id: int,
    resident_name: str,
    house_code: str,
    resident_type: ResidentType,
    resident_code: str | None,
    decision: VerificationStatus,
    decided_by_admin_id: int,
    decided_by_admin_name: str,
    reason: str | None = None,
) -> RegistrationApproval:
    row = RegistrationApproval(
        resident_id=resident_id,
        house_id=house_id,
        resident_name=resident_name,
        house_code=house_code,
        resident_type=resident_type,
        resident_code=resident_code,
        decision=decision,
        decided_by_admin_id=decided_by_admin_id,
        decided_by_admin_name=decided_by_admin_name,
        reason=reason,
    )
    db.add(row)
    db.flush()
    return row


def list_for_resident(db: Session, resident_id: int) -> list[RegistrationApproval]:
    return (
        db.query(RegistrationApproval)
        .filter(RegistrationApproval.resident_id == resident_id)
        .order_by(RegistrationApproval.decided_at.desc())
        .all()
    )
