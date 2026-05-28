from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlmodel import Session

from app.db.database import get_session
from app.schemas.tutor import (
    TutorChatRequest,
    TutorChatResponse,
    TutorMessageRead,
    TutorQualityCheck,
    TutorScenarioInfo,
    TutorSessionDetailResponse,
    TutorSessionRead,
)
from app.services.tutor_service import (
    chat_with_tutor,
    get_tutor_messages,
    get_tutor_quality_check,
    get_tutor_session_detail,
    list_tutor_scenarios,
    list_tutor_sessions,
)

router = APIRouter(prefix="/api/tutor", tags=["tutor"])
SessionDep = Annotated[Session, Depends(get_session)]


@router.get("/scenarios", response_model=list[TutorScenarioInfo])
def tutor_scenarios() -> list[TutorScenarioInfo]:
    return list_tutor_scenarios()


@router.post("/chat", response_model=TutorChatResponse)
def tutor_chat(request: TutorChatRequest, session: SessionDep) -> TutorChatResponse:
    return chat_with_tutor(request, session)


@router.get("/sessions", response_model=list[TutorSessionRead])
def tutor_sessions(
    session: SessionDep,
    student_id: int | None = Query(default=None),
    course_id: int | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=100),
) -> list[TutorSessionRead]:
    return list_tutor_sessions(session, student_id=student_id, course_id=course_id, limit=limit)


@router.get("/sessions/{session_id}", response_model=TutorSessionDetailResponse)
def tutor_session_detail(session_id: int, session: SessionDep) -> TutorSessionDetailResponse:
    return get_tutor_session_detail(session_id, session)


@router.get("/sessions/{session_id}/messages", response_model=list[TutorMessageRead])
def tutor_session_messages(session_id: int, session: SessionDep) -> list[TutorMessageRead]:
    return get_tutor_messages(session_id, session)


@router.get("/messages/{message_id}/quality-check", response_model=TutorQualityCheck)
def tutor_message_quality_check(message_id: int, session: SessionDep) -> TutorQualityCheck:
    return get_tutor_quality_check(message_id, session)
