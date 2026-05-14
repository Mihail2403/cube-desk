import asyncio
from functools import cached_property

from loguru import logger
from sentence_transformers import SentenceTransformer

from project.core.config import config


class EmbeddingService:
    """Loads the sentence-transformers model once; encodes off the event loop."""

    @cached_property
    def model(self) -> SentenceTransformer:
        logger.info("Loading embedding model: {}", config.EMBEDDING_MODEL_NAME)

        st_model = SentenceTransformer(config.EMBEDDING_MODEL_NAME)

        actual_dim = st_model.get_embedding_dimension()

        if actual_dim != config.EMBEDDING_VECTOR_SIZE:
            raise RuntimeError(
                f"EMBEDDING_VECTOR_SIZE={config.EMBEDDING_VECTOR_SIZE} does not match "
                f"model {config.EMBEDDING_MODEL_NAME!r} (output dimension is {actual_dim}). "
                "Set EMBEDDING_VECTOR_SIZE in env to match the model, or pick another model."
            )

        return st_model

    async def embed_text(self, text: str) -> list[float]:
        def _encode() -> list[float]:
            vec = self.model.encode(text, normalize_embeddings=True)
            return [float(x) for x in vec.tolist()]

        return await asyncio.to_thread(_encode)


embedding_service = EmbeddingService()
