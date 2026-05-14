"""ticket categories

Revision ID: a9b8c7d6e5f4
Revises: f0a1b2c3d4e5
Create Date: 2026-05-14 14:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "a9b8c7d6e5f4"
down_revision: Union[str, Sequence[str], None] = "f0a1b2c3d4e5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "ticket_categories",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(length=128), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )
    op.create_index("ix_ticket_categories_name", "ticket_categories", ["name"], unique=True)

    op.execute(
        sa.text(
            "INSERT INTO ticket_categories (name) VALUES ('Общее')",
        ),
    )

    op.add_column(
        "tickets",
        sa.Column(
            "category_id",
            sa.Integer(),
            sa.ForeignKey("ticket_categories.id", ondelete="RESTRICT"),
            nullable=True,
        ),
    )
    op.execute(sa.text("UPDATE tickets SET category_id = (SELECT id FROM ticket_categories ORDER BY id LIMIT 1)"))
    op.alter_column("tickets", "category_id", nullable=False)
    op.create_index("ix_tickets_category_id", "tickets", ["category_id"])


def downgrade() -> None:
    op.drop_index("ix_tickets_category_id", table_name="tickets")
    op.drop_column("tickets", "category_id")
    op.drop_index("ix_ticket_categories_name", table_name="ticket_categories")
    op.drop_table("ticket_categories")
