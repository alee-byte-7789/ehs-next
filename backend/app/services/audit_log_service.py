"""Audit log service."""
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog
from app.repositories import audit_log_repository


def log(db: Session, actor_admin_id: int | None, action: str, entity_type: str, entity_id: int | None, details: str | None = None) -> AuditLog:
    return audit_log_repository.log(db, actor_admin_id, action, entity_type, entity_id, details)


def list_audit_logs(db: Session, limit: int = 200) -> list[AuditLog]:
    return audit_log_repository.list_all(db, limit)
