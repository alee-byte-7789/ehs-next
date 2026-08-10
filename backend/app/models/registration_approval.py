"""RegistrationApproval model — permanent record of registration decisions.

Separate from AuditLog (system-wide, generic) because this needs to survive
resident deletion with resident-specific fields intact (name, house code,
resident code at the time of the decision) — AuditLog only keeps a free-text
`details` string, which isn't queryable the way a real history table is.

One row per decision: a normal approve/reject from the pending queue, or an
admin's manual registration (which is recorded as an immediate "approved"
decision). Rows are never updated — append-only, same as AuditLog.
"""
from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.enums import ResidentType, VerificationStatus


class RegistrationApproval(Base):
    __tablename__ = "registration_approvals"

    id: Mapped[int] = mapped_column(primary_key=True)

    resident_id: Mapped[int] = mapped_column(ForeignKey("residents.id"), nullable=False, index=True)
    house_id: Mapped[int] = mapped_column(ForeignKey("houses.id"), nullable=False)

    # Denormalised snapshot of the resident at decision time, so the row
    # still reads sensibly even after the resident is later edited or
    # deleted (deletion cascades these rows away explicitly, but edits
    # to name/house shouldn't rewrite history).
    resident_name: Mapped[str] = mapped_column(String(120), nullable=False)
    house_code: Mapped[str] = mapped_column(String(30), nullable=False)
    resident_type: Mapped[ResidentType] = mapped_column(Enum(ResidentType, name="residenttype"), nullable=False)
    resident_code: Mapped[str | None] = mapped_column(String(25), nullable=True)

    decision: Mapped[VerificationStatus] = mapped_column(
        Enum(VerificationStatus, name="verificationstatus"), nullable=False
    )
    decided_by_admin_id: Mapped[int] = mapped_column(Integer, nullable=False)
    decided_by_admin_name: Mapped[str] = mapped_column(String(120), nullable=False)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    decided_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True
    )

    def __repr__(self) -> str:
        return f"<RegistrationApproval {self.decision} resident={self.resident_id}>"
