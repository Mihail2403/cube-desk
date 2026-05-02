from datetime import datetime
from enum import StrEnum
from typing import TYPE_CHECKING, final

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column, relationship

from project.core.database import Base

if TYPE_CHECKING:
    from .auth_tokens import AuthToken
    from .tickets import Ticket, TicketMessage


@final
class User(Base):
    __tablename__ = "users"

    class UserRole(StrEnum):
        USER = "USER"
        SUPPORT = "SUPPORT"
        ADMIN = "ADMIN"

    id: Mapped[int] = mapped_column(primary_key=True)
    login: Mapped[str] = mapped_column(sa.String(64), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(sa.String(128))
    salt: Mapped[str] = mapped_column(sa.String(16))
    is_active: Mapped[bool] = mapped_column(default=True)
    role: Mapped[UserRole] = mapped_column(
        sa.String(16),
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(server_default=sa.func.now())

    auth_tokens: Mapped[list["AuthToken"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
    tickets: Mapped[list["Ticket"]] = relationship(
        back_populates="author",
        cascade="all, delete-orphan",
        order_by="Ticket.id",
    )
    messages: Mapped[list["TicketMessage"]] = relationship(
        back_populates="author",
        cascade="all, delete-orphan",
        order_by="TicketMessage.id",
    )
