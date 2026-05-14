from datetime import datetime

from pydantic import BaseModel, Field

from project import models
from project.routers.http.ticket_categories.schemas import TicketCategoryBriefResponse


class TicketCreateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=256)
    description: str | None = Field(default=None, max_length=10_000)
    priority: models.Ticket.TicketPriority | None = None
    category_id: int | None = None


class TicketUpdateRequest(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=256)
    description: str | None = Field(default=None, max_length=10_000)
    status: models.Ticket.TicketStatus | None = None
    priority: models.Ticket.TicketPriority | None = None
    assignee_id: int | None = None
    category_id: int | None = None
    resolution: str | None = Field(default=None, max_length=10_000)


class TicketAssigneeResponse(BaseModel):
    id: int
    login: str


class TicketAuthorResponse(BaseModel):
    id: int
    login: str


class TicketResponse(BaseModel):
    id: int
    author_id: int
    author: TicketAuthorResponse
    category_id: int
    category: TicketCategoryBriefResponse
    title: str
    description: str
    status: models.Ticket.TicketStatus
    priority: models.Ticket.TicketPriority
    assignee_id: int | None = None
    assignee: TicketAssigneeResponse | None = None
    resolution: str | None = None
    created_at: datetime
    updated_at: datetime


class SimilarSolutionResponse(BaseModel):
    ticket_id: int
    title: str
    category: str
    resolution: str
    score: float


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
    author: TicketAuthorResponse
    body: str
    created_at: datetime
    attachments: list[TicketMessageAttachmentResponse] = []
