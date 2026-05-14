from datetime import UTC, datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from project import models
from project.core.exceptions import ConflictError, NotFoundError
from project.repositories import tickets as tickets_repo
from project.repositories import users as users_repo


async def get_dashboard_stats(session: AsyncSession) -> dict[str, int]:
    now = datetime.now(UTC)
    since = now - timedelta(days=7)

    tickets_total = await tickets_repo.count_tickets(session)
    tickets_created_last_7_days = await tickets_repo.count_tickets(session, created_at__gte=since)
    tickets_updated_last_7_days = await tickets_repo.count_tickets(session, updated_at__gte=since)
    tickets_open = await tickets_repo.count_tickets(session, status=models.Ticket.TicketStatus.OPEN)
    tickets_in_progress = await tickets_repo.count_tickets(
        session, status=models.Ticket.TicketStatus.IN_PROGRESS
    )
    tickets_resolved = await tickets_repo.count_tickets(session, status=models.Ticket.TicketStatus.RESOLVED)
    tickets_closed = await tickets_repo.count_tickets(session, status=models.Ticket.TicketStatus.CLOSED)

    active_users_total = await users_repo.count_active_users(session)
    by_role = await users_repo.count_active_users_by_role(session)

    return {
        "tickets_total": tickets_total,
        "tickets_created_last_7_days": tickets_created_last_7_days,
        "tickets_updated_last_7_days": tickets_updated_last_7_days,
        "tickets_open": tickets_open,
        "tickets_in_progress": tickets_in_progress,
        "tickets_resolved": tickets_resolved,
        "tickets_closed": tickets_closed,
        "active_users_total": active_users_total,
        "active_users_role_user": by_role[models.User.UserRole.USER],
        "active_users_role_support": by_role[models.User.UserRole.SUPPORT],
        "active_users_role_admin": by_role[models.User.UserRole.ADMIN],
    }


async def update_user_role(
    session: AsyncSession,
    *,
    user_id: int,
    new_role: models.User.UserRole,
) -> models.User:
    user = await users_repo.get_user(session, user_id=user_id)
    if user is None:
        raise NotFoundError("Пользователь не найден")
    if not user.is_active:
        raise ConflictError("Нельзя менять роль деактивированного пользователя")

    if user.role == models.User.UserRole.ADMIN and new_role != models.User.UserRole.ADMIN:
        raise ConflictError("Роль администратора снять нельзя")

    if user.role == new_role:
        return user

    user.role = new_role
    await session.commit()
    await session.refresh(user)
    return user
