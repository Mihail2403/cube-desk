"""ticket_message_attachments

Revision ID: c7d8e9f0a1b2
Revises: f1a2b3c4d5e6
Create Date: 2026-05-01 22:05:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "c7d8e9f0a1b2"
down_revision: Union[str, Sequence[str], None] = "f1a2b3c4d5e6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "ticket_message_attachments",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "message_id",
            sa.Integer(),
            sa.ForeignKey("ticket_messages.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("storage_key", sa.String(length=1024), nullable=False),
        sa.Column("filename", sa.String(length=512), nullable=False),
        sa.Column("content_type", sa.String(length=256), nullable=False, server_default=""),
        sa.Column("size", sa.BigInteger(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )
    op.create_index(
        "ix_ticket_message_attachments_message_id",
        "ticket_message_attachments",
        ["message_id"],
    )
    op.create_index(
        "ix_ticket_message_attachments_storage_key",
        "ticket_message_attachments",
        ["storage_key"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_ticket_message_attachments_storage_key",
        table_name="ticket_message_attachments",
    )
    op.drop_index(
        "ix_ticket_message_attachments_message_id",
        table_name="ticket_message_attachments",
    )
    op.drop_table("ticket_message_attachments")
