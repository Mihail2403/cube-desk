import secrets
from datetime import datetime
from typing import TYPE_CHECKING, final

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column, relationship

from project.core.database import Base

if TYPE_CHECKING:
    from .users import User


@final
class AuthToken(Base):
    __tablename__ = "auth_tokens"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(sa.ForeignKey("users.id", ondelete="CASCADE"), index=True)

    access_token: Mapped[str] = mapped_column(sa.String(64), unique=True, index=True)
    access_expires_at: Mapped[datetime] = mapped_column(sa.DateTime(timezone=True))

    refresh_token: Mapped[str] = mapped_column(sa.String(64), unique=True, index=True)
    refresh_expires_at: Mapped[datetime] = mapped_column(sa.DateTime(timezone=True))

    user: Mapped["User"] = relationship(back_populates="auth_tokens")

    @classmethod
    def generate_token_value(cls, *, length: int = 15) -> str:
        return secrets.token_hex(length)
