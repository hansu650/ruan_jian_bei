from typing import Annotated

from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.db.database import get_session
from app.schemas.llm import (
    LLMCallLogRead,
    LLMChatRequest,
    LLMChatResponse,
    LLMGenerateRequest,
    LLMGenerateResponse,
    LLMScenario,
    LLMStatusResponse,
)
from app.services.llm_service import (
    chat_text,
    generate_text,
    get_provider_status,
    list_llm_logs,
    list_llm_scenarios,
)

router = APIRouter(prefix="/api/llm", tags=["llm"])
SessionDep = Annotated[Session, Depends(get_session)]


@router.get("/status", response_model=LLMStatusResponse)
def llm_status(session: SessionDep) -> LLMStatusResponse:
    return get_provider_status(session)


@router.get("/scenarios", response_model=list[LLMScenario])
def llm_scenarios() -> list[LLMScenario]:
    return list_llm_scenarios()


@router.post("/generate", response_model=LLMGenerateResponse)
def llm_generate(request: LLMGenerateRequest, session: SessionDep) -> LLMGenerateResponse:
    return generate_text(request, session)


@router.post("/chat", response_model=LLMChatResponse)
def llm_chat(request: LLMChatRequest, session: SessionDep) -> LLMChatResponse:
    return chat_text(request, session)


@router.get("/logs", response_model=list[LLMCallLogRead])
def llm_logs(session: SessionDep, limit: int = 50) -> list[LLMCallLogRead]:
    return list_llm_logs(session, limit=limit)
