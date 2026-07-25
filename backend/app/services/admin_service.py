"""
Admin management service.

Creating admins through the API (instead of only via
`scripts/create_admin.py`) is restricted to `super_admin` at the router
layer (see `app/api/v1/admins.py`) — this service assumes that check has
already happened and focuses only on the actual creation logic.
"""
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.admin import Admin
from app.repositories import admin_repository
from app.schemas.admin import CreateAdminRequest
from app.services import audit_log_service
from app.services.errors import ConflictError


def create_admin(db: Session, req: CreateAdminRequest, acting_admin_id: int | None = None) -> Admin:
    if admin_repository.email_taken(db, req.email):
        raise ConflictError(f"An admin with email {req.email} already exists.")

    admin = Admin(
        full_name=req.full_name,
        email=req.email,
        password_hash=hash_password(req.password),
        role=req.role,
    )
    db.add(admin)
    db.flush()
    audit_log_service.log(db, acting_admin_id, "create_admin", "admin", admin.id, details=f"role={req.role.value}")
    db.commit()
    db.refresh(admin)
    return admin


def list_admins(db: Session) -> list[Admin]:
    return admin_repository.list_all(db)
