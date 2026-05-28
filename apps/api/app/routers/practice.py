from typing import Annotated

from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.db.database import get_session
from app.schemas.practice import (
    GenerateQuizRequest,
    GenerateQuizResponse,
    PracticeQuizDetailResponse,
    PracticeQuizRead,
    QuestionTypeInfo,
)
from app.services.practice_service import (
    generate_quiz,
    get_quiz_detail,
    list_question_types,
    list_quizzes,
)

router = APIRouter(prefix="/api/practice", tags=["practice"])
SessionDep = Annotated[Session, Depends(get_session)]


@router.get("/question-types", response_model=list[QuestionTypeInfo])
def question_types() -> list[QuestionTypeInfo]:
    return list_question_types()


@router.post("/quizzes/generate", response_model=GenerateQuizResponse)
def generate_practice_quiz(
    request: GenerateQuizRequest,
    session: SessionDep,
) -> GenerateQuizResponse:
    return generate_quiz(request, session)


@router.get("/quizzes", response_model=list[PracticeQuizRead])
def practice_quizzes(
    session: SessionDep,
    student_id: int | None = None,
    course_id: int | None = None,
    step_id: int | None = None,
) -> list[PracticeQuizRead]:
    return list_quizzes(session, student_id=student_id, course_id=course_id, step_id=step_id)


@router.get("/quizzes/{quiz_id}", response_model=PracticeQuizDetailResponse)
def practice_quiz_detail(quiz_id: int, session: SessionDep) -> PracticeQuizDetailResponse:
    return get_quiz_detail(quiz_id, session)
