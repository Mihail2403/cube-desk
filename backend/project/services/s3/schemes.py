from pydantic import BaseModel


class StoredObject(BaseModel):
    bucket: str
    key: str
