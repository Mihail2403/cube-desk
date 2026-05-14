from typing import Any

from loguru import logger
from qdrant_client import AsyncQdrantClient
from qdrant_client import models as qdrant_models

from project.core.config import config


class TicketSolutionVectorStore:
    def __init__(self) -> None:
        self._client = AsyncQdrantClient(url=config.QDRANT_URL)

    @property
    def client(self) -> AsyncQdrantClient:
        return self._client

    async def close(self) -> None:
        await self._client.close()

    async def ensure_collection(self) -> None:
        if await self._client.collection_exists(config.QDRANT_COLLECTION):
            return

        await self._client.create_collection(
            collection_name=config.QDRANT_COLLECTION,
            vectors_config=qdrant_models.VectorParams(
                size=config.EMBEDDING_VECTOR_SIZE,
                distance=qdrant_models.Distance.COSINE,
            ),
        )

        logger.info("Created Qdrant collection: {}", config.QDRANT_COLLECTION)

    async def upsert_ticket_solution(
        self,
        *,
        ticket_id: int,
        vector: list[float],
        payload: dict[str, Any],
    ) -> None:
        await self.ensure_collection()
        await self._client.upsert(
            collection_name=config.QDRANT_COLLECTION,
            points=[
                qdrant_models.PointStruct(
                    id=ticket_id,
                    vector=vector,
                    payload=payload,
                )
            ],
        )

    async def delete_ticket_solution(self, *, ticket_id: int) -> None:
        if not await self._client.collection_exists(config.QDRANT_COLLECTION):
            return
        await self._client.delete(
            collection_name=config.QDRANT_COLLECTION,
            points_selector=qdrant_models.PointIdsList(points=[ticket_id]),
        )

    async def search_similar(
        self,
        *,
        query_vector: list[float],
        limit: int,
        exclude_ticket_id: int,
    ) -> list[Any]:
        await self.ensure_collection()
        res = await self._client.query_points(
            collection_name=config.QDRANT_COLLECTION,
            query=query_vector,
            limit=limit,
            with_payload=True,
            query_filter=qdrant_models.Filter(
                must_not=[
                    qdrant_models.FieldCondition(
                        key="ticket_id",
                        match=qdrant_models.MatchValue(value=exclude_ticket_id),
                    )
                ]
            ),
        )
        return list(res.points)


ticket_solution_vector_store = TicketSolutionVectorStore()
