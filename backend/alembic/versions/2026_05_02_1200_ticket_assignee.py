"""ticket assignee

Revision ID: e8f9a0b1c2d3
Revises: c7d8e9f0a1b2
Create Date: 2026-05-02 12:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "e8f9a0b1c2d3"
down_revision: Union[str, Sequence[str], None] = "c7d8e9f0a1b2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "tickets",
        sa.Column("assignee_id", sa.Integer(), nullable=True),
    )
    op.create_foreign_key(
        "fk_tickets_assignee_id_users",
        "tickets",
        "users",
        ["assignee_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index("ix_tickets_assignee_id", "tickets", ["assignee_id"])


def downgrade() -> None:
    op.drop_index("ix_tickets_assignee_id", table_name="tickets")
    op.drop_constraint("fk_tickets_assignee_id_users", "tickets", type_="foreignkey")
    op.drop_column("tickets", "assignee_id")
