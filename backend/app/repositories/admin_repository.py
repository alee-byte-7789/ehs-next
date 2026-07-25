"""Admin repository — plain DB access, no business rules."""
from sqlalchemy.orm import Session

from app.models.admin import Admin


def get_by_id(db: Session, admin_id: int) -> Admin | None:
    return db.query(Admin).filter(Admin.id == admin_id).first()


def get_by_email(db: Session, email: str) -> Admin | None:
    return db.query(Admin).filter(Admin.email == email).first()


def email_taken(db: Session, email: str) -> bool:
    return db.query(Admin.id).filter(Admin.email == email).first() is not None


def list_all(db: Session) -> list[Admin]:
    return db.query(Admin).order_by(Admin.created_at).all()


def list_by_roles(db: Session, roles: tuple) -> list[Admin]:
    return db.query(Admin).filter(Admin.role.in_(roles)).all()
