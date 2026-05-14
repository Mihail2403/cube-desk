from loguru import logger
from pydantic import ValidationError

from project import models, schemas
from project.services.ai.embedding import embedding_service
from project.services.ai.qdrant_store import ticket_solution_vector_store


def build_ticket_solution_text(ticket: models.Ticket) -> str:
    """Text used for indexing closed tickets (must match embedding input rules)."""
    parts: list[str] = []
    if ticket.title:
        parts.append(f"Title: {ticket.title}")
    if ticket.description:
        parts.append(f"Description: {ticket.description}")
    if ticket.category and ticket.category.name:
        parts.append(f"Category: {ticket.category.name}")
    if ticket.resolution and ticket.resolution.strip():
        parts.append(f"Resolution: {ticket.resolution.strip()}")
    return "\n".join(parts)


def _should_index(ticket: models.Ticket) -> bool:
    if ticket.status != models.Ticket.TicketStatus.CLOSED:
        return False
    return bool(ticket.resolution and ticket.resolution.strip())


async def sync_ticket_solution_index(ticket: models.Ticket) -> None:
    """Upsert or remove Qdrant point after DB state is committed."""
    try:
        if not _should_index(ticket):
            await ticket_solution_vector_store.delete_ticket_solution(ticket_id=ticket.id)
            return

        text = build_ticket_solution_text(ticket)
        vector = await embedding_service.embed_text(text)
        await ticket_solution_vector_store.upsert_ticket_solution(
            ticket_id=ticket.id,
            vector=vector,
            payload=schemas.SimilarSolutionPayload(
                ticket_id=ticket.id,
                title=ticket.title,
                category=ticket.category.name,
                resolution=ticket.resolution.strip() if ticket.resolution else "",
            ).model_dump(),
        )
    except Exception:
        logger.exception("Failed to sync ticket solution index for ticket_id={}", ticket.id)


async def search_similar_solutions(
    *,
    ticket: models.Ticket,
    limit: int,
) -> list[schemas.SimilarSolutionHit]:
    query_text = build_ticket_solution_text(ticket)
    if not query_text.strip():
        return []

    vector = await embedding_service.embed_text(query_text)
    scored = await ticket_solution_vector_store.search_similar(
        query_vector=vector,
        limit=limit,
        exclude_ticket_id=ticket.id,
    )

    hits: list[schemas.SimilarSolutionHit] = []
    for p in scored:
        payload = dict(p.payload or {})
        payload["score"] = p.score

        try:
            hits.append(schemas.SimilarSolutionHit.model_validate(payload))
        except ValidationError:
            logger.debug(
                "Skipping similar-solution point with invalid payload (ticket_id={})",
                payload.get("ticket_id"),
            )
            continue

    return hits
