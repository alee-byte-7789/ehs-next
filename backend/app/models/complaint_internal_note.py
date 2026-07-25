"""ComplaintInternalNote model — admin-only notes on a complaint.

Deliberately a separate table from ComplaintHistory: history is the
resident-visible timeline of status changes, while these notes are
internal admin-to-admin communication about a complaint (e.g. "called
resident, they're out until Friday") that a resident should never see.
"""
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class ComplaintInternalNote(Base):
    __tablename__ = "complaint_internal_notes"

    id: Mapped[int] = mapped_column(primary_key=True)
    complaint_id: Mapped[int] = mapped_column(ForeignKey("complaints.id"), nullable=False, index=True)
    admin_id: Mapped[int] = mapped_column(ForeignKey("admins.id"), nullable=False)
    note: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    def __repr__(self) -> str:
        return f"<ComplaintInternalNote complaint={self.complaint_id} admin={self.admin_id}>"
