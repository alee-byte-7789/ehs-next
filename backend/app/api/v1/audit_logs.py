"""Audit log endpoint — super_admin only."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.v1.deps import get_db, require_admin_roles
from app.models.enums import AdminRole
from app.schemas.audit_log import AuditLogOut
from app.services import audit_log_service

router = APIRouter(prefix="/audit-logs", tags=["audit-logs"])


@router.get("", response_model=list[AuditLogOut])
def list_audit_logs(
    limit: int = 200,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin_roles(AdminRole.SUPER_ADMIN)),
) -> list[AuditLogOut]:
    return audit_log_service.list_audit_logs(db, limit)
