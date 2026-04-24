"""RAG Evidence Chatbot router.

POST /chat/rag       — streams the answer as Server-Sent Events (SSE)
POST /chat/rag/sync  — returns the full answer as JSON (for testing/simple integrations)

SSE wire format (streaming endpoint):
  data: {"chunk": "<text token>"}\n\n        ← repeated for each streamed token
  data: {"done": true, "cited_sources": [...]}\n\n  ← final frame with full source list

The signal_id must exist in Firestore (written there by the /webhook/ingest pipeline).
The answer is grounded strictly in the signal's stored evidence trail — the model
cannot use outside knowledge (enforced by RAG_SYSTEM_PROMPT rules).
"""
import json
import logging
from collections.abc import AsyncGenerator

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse

from database import signal_repository
from engine import rag_agent
from schemas.chat import ChatRequest, ChatResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chat", tags=["chat"])


async def _sse_generator(
    request: ChatRequest,
) -> AsyncGenerator[str, None]:
    signal = await signal_repository.get_signal_by_id(request.signal_id)
    if signal is None:
        # Yield an SSE error frame so the frontend can handle it gracefully
        yield f"data: {json.dumps({'error': f'Signal {request.signal_id!r} not found'})}\n\n"
        return

    async for chunk in rag_agent.stream_answer(signal, request.user_question):
        yield f"data: {json.dumps({'chunk': chunk})}\n\n"

    # Final frame: signals end-of-stream and exposes the full evidence trail
    yield f"data: {json.dumps({'done': True, 'cited_sources': signal.evidence_trail})}\n\n"


@router.post("/rag", summary="Stream a RAG answer about a signal (SSE)")
async def rag_chat_stream(request: ChatRequest) -> StreamingResponse:
    """Ask a question about a specific signal's evidence and decision.

    Returns a Server-Sent Events stream. Each event is a JSON object:
    - `{"chunk": "..."}` while text is streaming
    - `{"done": true, "cited_sources": [...]}` as the final frame
    """
    # Validate signal existence before opening the stream so we can return a clean 404
    signal = await signal_repository.get_signal_by_id(request.signal_id)
    if signal is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Signal {request.signal_id!r} not found in Firestore",
        )

    logger.info(
        "RAG stream request (signal_id=%s, question=%r)",
        request.signal_id,
        request.user_question[:80],
    )

    # Re-use the validated signal rather than fetching again inside the generator
    async def _gen() -> AsyncGenerator[str, None]:
        async for chunk in rag_agent.stream_answer(signal, request.user_question):
            yield f"data: {json.dumps({'chunk': chunk})}\n\n"
        yield f"data: {json.dumps({'done': True, 'cited_sources': signal.evidence_trail})}\n\n"

    return StreamingResponse(
        _gen(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",  # disable nginx buffering for SSE
            "Connection": "keep-alive",
        },
    )


@router.post("/rag/sync", response_model=ChatResponse, summary="Non-streaming RAG answer (JSON)")
async def rag_chat_sync(request: ChatRequest) -> ChatResponse:
    """Same as /chat/rag but collects the full answer before returning.

    Use this for testing, Swagger UI exploration, or integrations that don't support SSE.
    """
    signal = await signal_repository.get_signal_by_id(request.signal_id)
    if signal is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Signal {request.signal_id!r} not found in Firestore",
        )

    logger.info(
        "RAG sync request (signal_id=%s, question=%r)",
        request.signal_id,
        request.user_question[:80],
    )

    answer = await rag_agent.get_full_answer(signal, request.user_question)

    return ChatResponse(
        signal_id=request.signal_id,
        answer=answer,
        cited_sources=signal.evidence_trail,
    )
