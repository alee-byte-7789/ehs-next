"""SocietyInfo model — a single row holding society-wide informational content.

This is deliberately a singleton (one row, id=1 always) rather than a
generic key-value table, since the content it holds (About text, office
bearers) is small, fixed in shape, and doesn't need per-item versioning
yet. If that changes later, this can be split into a proper content-blocks
table without much migration pain.

Now admin-editable (see app/api/v1/society_info.py's PUT endpoint) rather
than seed-once-only — office bearer names/messages are exactly the kind
of thing that changes over time (elections, new appointments) and
shouldn't require a code change + migration each time.
"""
from datetime import datetime, timezone

from sqlalchemy import DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class SocietyInfo(Base):
    __tablename__ = "society_info"

    id: Mapped[int] = mapped_column(primary_key=True)

    about_text: Mapped[str] = mapped_column(Text, nullable=False)

    chairman_name: Mapped[str | None] = mapped_column(Text, nullable=True)
    chairman_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    deputy_chairman_name: Mapped[str | None] = mapped_column(Text, nullable=True)
    deputy_chairman_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    secretary_name: Mapped[str | None] = mapped_column(Text, nullable=True)
    secretary_designation: Mapped[str | None] = mapped_column(Text, nullable=True)
    secretary_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    def __repr__(self) -> str:
        return f"<SocietyInfo id={self.id}>"
