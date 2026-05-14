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
class TicketCategory(Base):
    __tablename__ = "ticket_categories"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(sa.String(128), unique=True, index=True)
    created_at: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True),
        server_default=sa.func.now(),
    )

    tickets: Mapped[list["Ticket"]] = relationship(
        back_populates="category",
        order_by="Ticket.id",
    )


@final
class Ticket(Base):
    __tablename__ = "tickets"

    class TicketStatus(StrEnum):
        OPEN = "OPEN"
        IN_PROGRESS = "IN_PROGRESS"
        RESOLVED = "RESOLVED"
        CLOSED = "CLOSED"

    class TicketPriority(StrEnum):
        LOW = "LOW"
        MEDIUM = "MEDIUM"
        HIGH = "HIGH"
        URGENT = "URGENT"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    author_id: Mapped[int] = mapped_column(
        sa.ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
    )
    assignee_id: Mapped[int | None] = mapped_column(
        sa.ForeignKey("users.id", ondelete="SET NULL"),
        index=True,
        nullable=True,
    )
    title: Mapped[str] = mapped_column(sa.String(256))
    description: Mapped[str] = mapped_column(sa.Text(), server_default=sa.text("''"))
    status: Mapped[TicketStatus] = mapped_column(
        sa.String(32),
        index=True,
    )
    priority: Mapped[TicketPriority] = mapped_column(
        sa.String(32),
        index=True,
        server_default=sa.text("'MEDIUM'"),
    )
    category_id: Mapped[int] = mapped_column(
        sa.ForeignKey("ticket_categories.id", ondelete="RESTRICT"),
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True),
        server_default=sa.func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True),
        server_default=sa.func.now(),
        onupdate=sa.func.now(),
    )

    author: Mapped["User"] = relationship(
        back_populates="tickets",
        foreign_keys=[author_id],
    )
    assignee: Mapped["User | None"] = relationship(
        back_populates="assigned_tickets",
        foreign_keys=[assignee_id],
    )
    category: Mapped["TicketCategory"] = relationship(back_populates="tickets")
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
