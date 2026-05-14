from pydantic import BaseModel, Field

from project import models


class AdminDashboardStatsResponse(BaseModel):
    tickets_total: int = Field(ge=0)
    tickets_created_last_7_days: int = Field(ge=0)
    tickets_updated_last_7_days: int = Field(ge=0)
    tickets_open: int = Field(ge=0)
    tickets_in_progress: int = Field(ge=0)
    tickets_resolved: int = Field(ge=0)
    tickets_closed: int = Field(ge=0)
    active_users_total: int = Field(ge=0)
    active_users_role_user: int = Field(ge=0)
    active_users_role_support: int = Field(ge=0)
    active_users_role_admin: int = Field(ge=0)


class UserRoleUpdateRequest(BaseModel):
    role: models.User.UserRole


class TicketCategoryCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=128)


class TicketCategoryUpdateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=128)
