"""Staff management service."""
from sqlalchemy.orm import Session

from app.models.staff import Staff
from app.repositories import staff_repository
from app.schemas.staff import StaffCreateRequest


def create_staff(db: Session, req: StaffCreateRequest) -> Staff:
    staff = Staff(full_name=req.full_name, phone=req.phone, category=req.category)
    db.add(staff)
    db.commit()
    db.refresh(staff)
    return staff


def list_active_staff(db: Session) -> list[Staff]:
    return staff_repository.list_active(db)


def list_all_staff(db: Session) -> list[Staff]:
    return staff_repository.list_all(db)
