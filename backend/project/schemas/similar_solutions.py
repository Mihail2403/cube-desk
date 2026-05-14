from pydantic import BaseModel


class SimilarSolutionPayload(BaseModel):
    ticket_id: int
    title: str
    category: str
    resolution: str


class SimilarSolutionHit(SimilarSolutionPayload):
    score: float
