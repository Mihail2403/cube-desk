from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import uuid4

from fastapi import UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from project import models
from project.core.config import config
from project.core.exceptions import BadRequestError, FileSizeError, ForbiddenError, NotFoundError
from project.repositories import tickets as tickets_repo
from project.repositories import users as users_repo
from project.services.s3 import service as s3_service


async def have_access_to_ticket(
    *,
    user: models.User,
    ticket: models.Ticket,
) -> bool:
    if user.role == models.User.UserRole.USER:
        return ticket.author_id == user.id
    else:
        return True


async def create_ticket(
    session: AsyncSession,
    *,
    author_id: int,
    title: str,
    description: str | None,
) -> models.Ticket:
    ticket = await tickets_repo.create_ticket(
        session,
        instance=models.Ticket(
            author_id=author_id,
            title=title,
            description=description or "",
            status=models.Ticket.TicketStatus.OPEN,
        ),
    )
    await session.commit()
    reloaded = await tickets_repo.get_ticket(session, ticket_id=ticket.id)
    if reloaded is None:
        raise NotFoundError("Ticket not found")
    return reloaded


async def get_tickets(
    session: AsyncSession,
    *,
    user: models.User,
    limit: int,
    offset: int,
    status: models.Ticket.TicketStatus | None = None,
    updated_at__gt: datetime | None = None,
) -> list[models.Ticket]:
    if user.role == models.User.UserRole.USER:
        return await tickets_repo.get_tickets(
            session,
            author_id=user.id,
            status=status,
            updated_at__gt=updated_at__gt,
            limit=limit,
            offset=offset,
        )
    else:
        return await tickets_repo.get_tickets(
            session,
            status=status,
            updated_at__gt=updated_at__gt,
            limit=limit,
            offset=offset,
        )


async def get_ticket(
    session: AsyncSession,
    *,
    ticket_id: int,
    user: models.User,
) -> models.Ticket:
    ticket = await tickets_repo.get_ticket(session, ticket_id=ticket_id)
    if ticket is None:
        raise NotFoundError("Ticket not found")
    if not await have_access_to_ticket(user=user, ticket=ticket):
        raise ForbiddenError("No access to this ticket")
    return ticket


async def update_ticket(
    session: AsyncSession,
    *,
    user: models.User,
    ticket_id: int,
    patch_data: dict[str, Any],
) -> models.Ticket:
    ticket = await get_ticket(session, ticket_id=ticket_id, user=user)

    if "title" in patch_data:
        ticket.title = patch_data["title"]
    if "description" in patch_data:
        ticket.description = patch_data["description"] or ""
    if "status" in patch_data:
        ticket.status = patch_data["status"]

    if "assignee_id" in patch_data:
        if user.role == models.User.UserRole.USER:
            raise ForbiddenError("Only staff can change assignee")
        assignee_id = patch_data["assignee_id"]
        if assignee_id is None:
            ticket.assignee_id = None
        else:
            assignee = await users_repo.get_user(session, user_id=assignee_id)
            if assignee is None or not assignee.is_active:
                raise BadRequestError("Invalid assignee")

            if assignee.role not in (
                models.User.UserRole.SUPPORT,
                models.User.UserRole.ADMIN,
            ):
                raise BadRequestError("Assignee must be support or admin")

            ticket.assignee_id = assignee_id

    await session.commit()
    reloaded = await tickets_repo.get_ticket(session, ticket_id=ticket.id)
    if reloaded is None:
        raise NotFoundError("Ticket not found")
    return reloaded


async def create_message(
    session: AsyncSession,
    *,
    user: models.User,
    ticket_id: int,
    body: str,
    files: list[UploadFile],
) -> models.TicketMessage:
    if len(files) > config.ATTACHMENTS_MAX_FILES:
        raise BadRequestError(
            "Too many attachments",
            details={"max_files": config.ATTACHMENTS_MAX_FILES},
        )

    validated_files: list[tuple[UploadFile, int, str, str]] = []
    for file in files:
        if not file.filename:
            raise BadRequestError("Attachment filename is required")

        file.file.seek(0, 2)
        size = int(file.file.tell())
        file.file.seek(0)

        if size > config.ATTACHMENTS_MAX_FILE_SIZE_BYTES:
            raise FileSizeError(
                "Attachment is too large",
                details={
                    "max_bytes": config.ATTACHMENTS_MAX_FILE_SIZE_BYTES,
                    "actual_bytes": size,
                    "filename": file.filename,
                },
            )

        safe_filename = file.filename.replace("\\", "_").replace("/", "_")
        upload_id = uuid4().hex
        validated_files.append((file, size, safe_filename, upload_id))

    ticket = await get_ticket(session, ticket_id=ticket_id, user=user)

    message = await tickets_repo.create_message(
        session,
        instance=models.TicketMessage(
            ticket_id=ticket.id,
            author_id=user.id,
            body=body,
        ),
    )

    for file, size, safe_filename, upload_id in validated_files:
        object_key = f"ticket-messages/{ticket.id}/{message.id}/{upload_id}-{safe_filename}"
        file.file.seek(0)
        await s3_service.put_object(
            key=object_key,
            fileobj=file.file,
            content_type=file.content_type,
        )

        await tickets_repo.create_message_attachment(
            session,
            instance=models.TicketMessageAttachment(
                message_id=message.id,
                storage_key=object_key,
                filename=file.filename or "",
                content_type=file.content_type or "",
                size=size,
            ),
        )

    await session.commit()
    reloaded = await session.execute(
        select(models.TicketMessage)
        .where(models.TicketMessage.id == message.id)
        .options(selectinload(models.TicketMessage.attachments))
    )
    return reloaded.scalar_one()


async def get_messages(
    session: AsyncSession,
    *,
    user: models.User,
    ticket_id: int,
    limit: int,
    offset: int,
    id__gt: int | None = None,
) -> list[models.TicketMessage]:
    ticket = await get_ticket(session, ticket_id=ticket_id, user=user)
    messages = await tickets_repo.get_messages(
        session,
        ticket_id=ticket.id,
        id__gt=id__gt,
        limit=limit,
        offset=offset,
    )
    return messages
