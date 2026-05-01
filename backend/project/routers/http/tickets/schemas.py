from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

from project import models


class TicketCreateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=256)
    description: str | None = Field(default=None, max_length=10_000)


class TicketUpdateRequest(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=256)
    description: str | None = Field(default=None, max_length=10_000)
    status: models.Ticket.TicketStatus | None = None


class TicketResponse(BaseModel):
    id: int
    author_id: int
    title: str
    description: str
    status: models.Ticket.TicketStatus
    created_at: datetime
    updated_at: datetime


class TicketMessageCreateRequest(BaseModel):
    body: str = Field(min_length=1, max_length=10_000)


class TicketMessageAttachmentResponse(BaseModel):
    id: int
    message_id: int
    storage_key: str
    filename: str
    content_type: str
    size: int
    created_at: datetime
    download_url: str


class TicketMessageResponse(BaseModel):
    id: int
    ticket_id: int
    author_id: int
    body: str
    created_at: datetime
    attachments: list[TicketMessageAttachmentResponse] = []
