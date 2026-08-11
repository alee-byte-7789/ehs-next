"""add registration_approvals table

Revision ID: e1756e60ea0f
Revises: b7d3f21ac845
Create Date: 2026-08-10 09:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e1756e60ea0f'
down_revision: Union[str, Sequence[str], None] = 'b7d3f21ac845'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('registration_approvals',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('resident_id', sa.Integer(), nullable=False),
    sa.Column('house_id', sa.Integer(), nullable=False),
    sa.Column('resident_name', sa.String(length=120), nullable=False),
    sa.Column('house_code', sa.String(length=30), nullable=False),
    sa.Column(
        'resident_type',
        sa.Enum('OWNER', 'TENANT', name='residenttype', create_type=False),
        nullable=False,
    ),
    sa.Column('resident_code', sa.String(length=25), nullable=True),
    sa.Column(
        'decision',
        sa.Enum('PENDING', 'APPROVED', 'REJECTED', name='verificationstatus', create_type=False),
        nullable=False,
    ),
    sa.Column('decided_by_admin_id', sa.Integer(), nullable=False),
    sa.Column('decided_by_admin_name', sa.String(length=120), nullable=False),
    sa.Column('reason', sa.Text(), nullable=True),
    sa.Column('decided_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['resident_id'], ['residents.id']),
    sa.ForeignKeyConstraint(['house_id'], ['houses.id']),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_registration_approvals_resident_id'), 'registration_approvals', ['resident_id'], unique=False)
    op.create_index(op.f('ix_registration_approvals_decided_at'), 'registration_approvals', ['decided_at'], unique=False)
    # ### end Alembic commands ###


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_registration_approvals_decided_at'), table_name='registration_approvals')
    op.drop_index(op.f('ix_registration_approvals_resident_id'), table_name='registration_approvals')
    op.drop_table('registration_approvals')
    # ### end Alembic commands ###
