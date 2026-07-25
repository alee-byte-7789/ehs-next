"""Audit log repository — plain DB access, append-only."""
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog


def log(
    db: Session,
    actor_admin_id: int | None,
    action: str,
    entity_type: str,
    entity_id: int | None,
    details: str | None = None,
) -> AuditLog:
    row = AuditLog(
        actor_admin_id=actor_admin_id, action=action,
        entity_type=entity_type, entity_id=entity_id, details=details,
    )
    db.add(row)
    db.flush()
    return row


def list_all(db: Session, limit: int = 200) -> list[AuditLog]:
    return db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit).all()
