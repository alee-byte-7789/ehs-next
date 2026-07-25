"""Staff repository — plain DB access."""
from sqlalchemy.orm import Session

from app.models.staff import Staff


def get_by_id(db: Session, staff_id: int) -> Staff | None:
    return db.query(Staff).filter(Staff.id == staff_id).first()


def list_active(db: Session) -> list[Staff]:
    return db.query(Staff).filter(Staff.is_active.is_(True)).order_by(Staff.full_name).all()


def list_all(db: Session) -> list[Staff]:
    return db.query(Staff).order_by(Staff.full_name).all()
