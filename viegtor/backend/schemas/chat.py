from typing import Annotated
from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    signal_id: str
    user_question: Annotated[
        str,
        Field(min_length=1, max_length=500, description="Question about the signal's evidence or decision"),
    ]


class ChatResponse(BaseModel):
    """Returned by the non-streaming /chat/rag/sync endpoint."""
    signal_id: str
    answer: str
    cited_sources: list[str] = Field(
        description="Evidence trail entries the model was given as context"
    )
