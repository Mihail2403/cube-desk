from datetime import datetime

from pydantic import BaseModel


class TicketCategoryBriefResponse(BaseModel):
    id: int
    name: str


class TicketCategoryResponse(TicketCategoryBriefResponse):
    created_at: datetime
