"""ticket priority

Revision ID: f0a1b2c3d4e5
Revises: e8f9a0b1c2d3
Create Date: 2026-05-14 12:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "f0a1b2c3d4e5"
down_revision: Union[str, Sequence[str], None] = "e8f9a0b1c2d3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "tickets",
        sa.Column(
            "priority",
            sa.String(length=32),
            server_default=sa.text("'MEDIUM'"),
            nullable=False,
        ),
    )
    op.create_index("ix_tickets_priority", "tickets", ["priority"])


def downgrade() -> None:
    op.drop_index("ix_tickets_priority", table_name="tickets")
    op.drop_column("tickets", "priority")
