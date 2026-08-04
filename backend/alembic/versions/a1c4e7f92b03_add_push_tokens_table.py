"""add push_tokens table for multi-device push support

Revision ID: a1c4e7f92b03
Revises: 75412778c4f3
Create Date: 2026-08-04 12:40:00.000000

Hand-written, following the precedent set by 75412778c4f3 rather than
trusting autogenerate (this project has a documented history of SQLite
autogenerate false positives, e.g. the spurious `admins.role` diff).

Three things worth noting:
1. `notificationrecipienttype` ALREADY exists as a Postgres enum type
   (created by the initial schema for the notifications table), so it is
   declared here with create_type=False — otherwise create_table would
   emit CREATE TYPE and Postgres would error with "type already exists".
2. `pushtokenkind` is brand new and IS created explicitly first.
3. SQLAlchemy's Enum stores the member NAME, not the value — hence
   'RESIDENT'/'ADMIN' and 'FCM'/'EXPO' in uppercase here.

The old `residents.fcm_token` / `push_token` and `admins.fcm_token` /
`push_token` columns are deliberately LEFT IN PLACE, not dropped:
existing values are copied into the new table, and keeping the columns
means a rollback (or a deploy that is briefly mid-flight, serving both
old and new code) cannot lose data or 500.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'a1c4e7f92b03'
down_revision: Union[str, Sequence[str], None] = '75412778c4f3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    is_postgres = bind.dialect.name == "postgresql"

    kind_enum = postgresql.ENUM('FCM', 'EXPO', name='pushtokenkind')
    if is_postgres:
        kind_enum.create(bind, checkfirst=True)
        kind_enum = postgresql.ENUM('FCM', 'EXPO', name='pushtokenkind', create_type=False)

    owner_enum = postgresql.ENUM(
        'RESIDENT', 'ADMIN', 'STAFF', name='notificationrecipienttype', create_type=False
    )

    op.create_table(
        'push_tokens',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('owner_type', owner_enum, nullable=False),
        sa.Column('owner_id', sa.Integer(), nullable=False),
        sa.Column('token', sa.String(length=512), nullable=False),
        sa.Column('kind', kind_enum, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_seen_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('token', name='uq_push_tokens_token'),
    )
    op.create_index(op.f('ix_push_tokens_owner_id'), 'push_tokens', ['owner_id'], unique=False)

    # --- Carry existing single-column tokens over so nobody who already
    # --- granted permission has to re-grant it after this deploy.
    # NOT EXISTS guards against the unique constraint: in principle the
    # same token string could appear on two rows (e.g. one browser used
    # to sign in as both a resident and an admin on the same origin).
    for table, owner_type in (('residents', 'RESIDENT'), ('admins', 'ADMIN')):
        for column, kind in (('fcm_token', 'FCM'), ('push_token', 'EXPO')):
            op.execute(f"""
                INSERT INTO push_tokens (owner_type, owner_id, token, kind, created_at, last_seen_at)
                SELECT '{owner_type}', s.id, s.{column}, '{kind}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                FROM {table} s
                WHERE s.{column} IS NOT NULL
                  AND s.{column} <> ''
                  AND NOT EXISTS (SELECT 1 FROM push_tokens pt WHERE pt.token = s.{column})
            """)


def downgrade() -> None:
    bind = op.get_bind()
    op.drop_index(op.f('ix_push_tokens_owner_id'), table_name='push_tokens')
    op.drop_table('push_tokens')
    if bind.dialect.name == "postgresql":
        postgresql.ENUM(name='pushtokenkind').drop(bind, checkfirst=True)
