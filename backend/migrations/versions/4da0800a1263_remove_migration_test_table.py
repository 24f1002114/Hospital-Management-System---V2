"""remove migration test table

Revision ID: 4da0800a1263
Revises: 04c8486f2ea4
Create Date: 2026-06-24 20:25:00.995884

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4da0800a1263'
down_revision: Union[str, Sequence[str], None] = '04c8486f2ea4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_table('migration_test')

def downgrade() -> None:
    op.create_table('migration_test',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('message', sa.String(length=100), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
