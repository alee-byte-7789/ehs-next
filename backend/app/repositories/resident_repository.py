"""Resident repository — plain DB access, no business rules."""
from datetime import datetime

from sqlalchemy import func, or_
from sqlalchemy.orm import Session, joinedload

from app.models.enums import ResidentType, VerificationStatus
from app.models.house import House
from app.models.registration_approval import RegistrationApproval
from app.models.resident import Resident


def get_by_id(db: Session, resident_id: int) -> Resident | None:
    return db.query(Resident).filter(Resident.id == resident_id).first()


def get_by_phone_or_email(db: Session, identifier: str) -> Resident | None:
    return (
        db.query(Resident)
        .filter((Resident.phone == identifier) | (Resident.email == identifier))
        .first()
    )


def phone_or_email_taken(db: Session, phone: str, email: str | None) -> bool:
    query = db.query(Resident).filter(Resident.phone == phone)
    if email:
        query = db.query(Resident).filter((Resident.phone == phone) | (Resident.email == email))
    return db.query(query.exists()).scalar()


def cnic_taken(db: Session, cnic: str) -> bool:
    """One CNIC identifies one person, so it must not appear twice.

    Enforced here in application code rather than as a DB unique constraint,
    matching how phone/email uniqueness already works in this project —
    residents predating the CNIC field have NULL, which a NOT NULL unique
    constraint could not accommodate.
    """
    return db.query(db.query(Resident).filter(Resident.cnic == cnic).exists()).scalar()


def list_pending(db: Session) -> list[Resident]:
    return (
        db.query(Resident)
        .filter(Resident.verification_status == VerificationStatus.PENDING)
        .order_by(Resident.created_at)
        .all()
    )


def has_approved_owner(db: Session, house_id: int) -> bool:
    return (
        db.query(Resident)
        .filter(
            Resident.house_id == house_id,
            Resident.resident_type == ResidentType.OWNER,
            Resident.verification_status == VerificationStatus.APPROVED,
        )
        .first()
        is not None
    )


def next_tenant_sequence(db: Session, house_id: int) -> int:
    """Highest existing tenant_sequence for this house (approved or not), plus one.
    Computed from max rather than count so a rejected tenant's number is never reused."""
    current_max = (
        db.query(func.max(Resident.tenant_sequence))
        .filter(Resident.house_id == house_id, Resident.resident_type == ResidentType.TENANT)
        .scalar()
    )
    return (current_max or 0) + 1


def search(
    db: Session,
    *,
    q: str | None = None,
    resident_type: ResidentType | None = None,
    status: VerificationStatus | None = None,
    created_from: datetime | None = None,
    created_to: datetime | None = None,
    limit: int = 200,
) -> list[Resident]:
    """All residents matching the given filters, newest first.

    `q` is a single free-text box matching name, resident code, phone,
    email, CNIC or house code — joined against House since house_code
    lives on that table, not on Resident.
    """
    query = db.query(Resident).join(House, Resident.house_id == House.id).options(joinedload(Resident.house))

    if q:
        like = f"%{q.strip()}%"
        query = query.filter(
            or_(
                Resident.full_name.ilike(like),
                Resident.resident_code.ilike(like),
                Resident.phone.ilike(like),
                Resident.email.ilike(like),
                Resident.cnic.ilike(like),
                House.house_code.ilike(like),
            )
        )
    if resident_type:
        query = query.filter(Resident.resident_type == resident_type)
    if status:
        query = query.filter(Resident.verification_status == status)
    if created_from:
        query = query.filter(Resident.created_at >= created_from)
    if created_to:
        query = query.filter(Resident.created_at <= created_to)

    return query.order_by(Resident.created_at.desc()).limit(limit).all()


def search_with_approver(
    db: Session,
    *,
    q: str | None = None,
    resident_type: ResidentType | None = None,
    status: VerificationStatus | None = None,
    created_from: datetime | None = None,
    created_to: datetime | None = None,
    limit: int = 200,
) -> list[tuple[Resident, str | None, datetime | None]]:
    """Same filters as `search`, but each row is paired with who approved
    that resident and when (their most recent APPROVED decision, if any) —
    for the admin Manage Users list, which shows "approved by" per row
    without a click-through to the detail page.

    A resident can have more than one row in `registration_approvals` (a
    rejection followed by a later re-approval, for example); this always
    takes the latest APPROVED one, via a window-function subquery rather
    than N+1 queries per row.
    """
    latest_rank = (
        db.query(
            RegistrationApproval.resident_id,
            RegistrationApproval.decided_by_admin_name,
            RegistrationApproval.decided_at,
            func.row_number()
            .over(
                partition_by=RegistrationApproval.resident_id,
                order_by=RegistrationApproval.decided_at.desc(),
            )
            .label("rn"),
        )
        .filter(RegistrationApproval.decision == VerificationStatus.APPROVED)
        .subquery()
    )

    query = (
        db.query(Resident, latest_rank.c.decided_by_admin_name, latest_rank.c.decided_at)
        .join(House, Resident.house_id == House.id)
        .outerjoin(
            latest_rank,
            (latest_rank.c.resident_id == Resident.id) & (latest_rank.c.rn == 1),
        )
        .options(joinedload(Resident.house))
    )

    if q:
        like = f"%{q.strip()}%"
        query = query.filter(
            or_(
                Resident.full_name.ilike(like),
                Resident.resident_code.ilike(like),
                Resident.phone.ilike(like),
                Resident.email.ilike(like),
                Resident.cnic.ilike(like),
                House.house_code.ilike(like),
            )
        )
    if resident_type:
        query = query.filter(Resident.resident_type == resident_type)
    if status:
        query = query.filter(Resident.verification_status == status)
    if created_from:
        query = query.filter(Resident.created_at >= created_from)
    if created_to:
        query = query.filter(Resident.created_at <= created_to)

    return query.order_by(Resident.created_at.desc()).limit(limit).all()
