from pydantic import BaseModel, ConfigDict

from project import models


class SupportUserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    login: str
    role: models.User.UserRole
