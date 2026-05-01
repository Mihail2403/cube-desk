from datetime import datetime
from enum import StrEnum
from typing import TYPE_CHECKING, final

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column, relationship

from project.core.database import Base

if TYPE_CHECKING:
    from .tickets import TicketMessage
    from .users import User


@final
class Ticket(Base):
    __tablename__ = "tickets"

    class TicketStatus(StrEnum):
        OPEN = "open"
        IN_PROGRESS = "in_progress"
        RESOLVED = "resolved"
        CLOSED = "closed"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    author_id: Mapped[int] = mapped_column(
        sa.ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
    )
    title: Mapped[str] = mapped_column(sa.String(256))
    description: Mapped[str] = mapped_column(sa.Text(), server_default=sa.text("''"))
    status: Mapped[TicketStatus] = mapped_column(index=True, server_default=sa.text("'open'"))
    created_at: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True),
        server_default=sa.func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True),
        server_default=sa.func.now(),
        onupdate=sa.func.now(),
    )

    author: Mapped["User"] = relationship(back_populates="tickets")
    messages: Mapped[list["TicketMessage"]] = relationship(
        back_populates="ticket",
        cascade="all, delete-orphan",
        order_by="TicketMessage.id",
    )


@final
class TicketMessage(Base):
    __tablename__ = "ticket_messages"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    ticket_id: Mapped[int] = mapped_column(
        sa.ForeignKey("tickets.id", ondelete="CASCADE"),
        index=True,
    )
    author_id: Mapped[int] = mapped_column(
        sa.ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
    )
    body: Mapped[str] = mapped_column(sa.Text())
    created_at: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True),
        server_default=sa.func.now(),
    )
    ticket: Mapped["Ticket"] = relationship(back_populates="messages")
    author: Mapped["User"] = relationship(back_populates="messages")
    attachments: Mapped[list["TicketMessageAttachment"]] = relationship(
        back_populates="message",
        cascade="all, delete-orphan",
        order_by="TicketMessageAttachment.id",
    )


@final
class TicketMessageAttachment(Base):
    __tablename__ = "ticket_message_attachments"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    message_id: Mapped[int] = mapped_column(
        sa.ForeignKey("ticket_messages.id", ondelete="CASCADE"),
        index=True,
    )
    storage_key: Mapped[str] = mapped_column(sa.String(1024), unique=True, index=True)
    filename: Mapped[str] = mapped_column(sa.String(512))
    content_type: Mapped[str] = mapped_column(sa.String(256), server_default=sa.text("''"))
    size: Mapped[int] = mapped_column(sa.BigInteger())
    created_at: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True),
        server_default=sa.func.now(),
    )

    message: Mapped["TicketMessage"] = relationship(back_populates="attachments")
