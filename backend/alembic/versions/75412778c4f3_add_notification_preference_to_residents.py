"""add notification_preference to residents

Revision ID: 75412778c4f3
Revises: 4f2a38d2c27f
Create Date: 2026-07-31 10:37:08.556145

NOTE: hand-written rather than trusting autogenerate. Two real issues
caught before this was ever run:
1. Autogenerate's generated enum values incorrectly included 'CRITICAL'
   for `notificationpreference` — traced to a genuine copy/paste mistake
   in enums.py itself (since fixed), not just a rendering quirk.
2. This is a brand-new Postgres enum type, and `op.add_column` does NOT
   auto-create a new enum type the way `op.create_table` does (confirmed
   directly in migration 82cdc490b76b) — it must be created explicitly
   first, or Postgres errors with "type does not exist".
Also removes the recurring spurious `admins.role` type-change diff (a
SQLite-only autogenerate false positive documented in prior migrations).
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '75412778c4f3'
down_revision: Union[str, Sequence[str], None] = '4f2a38d2c27f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()

    notification_preference_enum = postgresql.ENUM(
        'PUSH_AND_EMAIL', 'PUSH_ONLY', 'EMAIL_ONLY', 'NONE', name='notificationpreference'
    )
    if bind.dialect.name == "postgresql":
        notification_preference_enum.create(bind, checkfirst=True)

    op.add_column('residents', sa.Column(
        'notification_preference', notification_preference_enum,
        nullable=False, server_default='PUSH_AND_EMAIL',
    ))


def downgrade() -> None:
    bind = op.get_bind()
    op.drop_column('residents', 'notification_preference')
    if bind.dialect.name == "postgresql":
        postgresql.ENUM(name='notificationpreference').drop(bind, checkfirst=True)
