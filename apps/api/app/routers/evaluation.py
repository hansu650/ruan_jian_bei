from typing import Annotated

from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.db.database import get_session
from app.schemas.evaluation import LearningAnalyticsSummary, LearningEvaluationReportRead
from app.schemas.practice import (
    PracticeAttemptDetailResponse,
    PracticeAttemptRead,
    SubmitQuizRequest,
    SubmitQuizResponse,
)
from app.services.evaluation_service import (
    get_attempt_detail,
    get_evaluation_report,
    get_learning_analytics_summary,
    list_attempts,
    list_evaluation_reports,
    submit_quiz,
)

router = APIRouter(prefix="/api/evaluation", tags=["evaluation"])
SessionDep = Annotated[Session, Depends(get_session)]


@router.post("/attempts/submit", response_model=SubmitQuizResponse)
def submit_practice_attempt(
    request: SubmitQuizRequest,
    session: SessionDep,
) -> SubmitQuizResponse:
    return submit_quiz(request, session)


@router.get("/attempts", response_model=list[PracticeAttemptRead])
def practice_attempts(
    session: SessionDep,
    student_id: int | None = None,
    course_id: int | None = None,
    quiz_id: int | None = None,
) -> list[PracticeAttemptRead]:
    return list_attempts(session, student_id=student_id, course_id=course_id, quiz_id=quiz_id)


@router.get("/attempts/{attempt_id}", response_model=PracticeAttemptDetailResponse)
def practice_attempt_detail(
    attempt_id: int,
    session: SessionDep,
) -> PracticeAttemptDetailResponse:
    return get_attempt_detail(attempt_id, session)


@router.get("/reports", response_model=list[LearningEvaluationReportRead])
def evaluation_reports(
    session: SessionDep,
    student_id: int | None = None,
    course_id: int | None = None,
) -> list[LearningEvaluationReportRead]:
    return list_evaluation_reports(session, student_id=student_id, course_id=course_id)


@router.get("/reports/{report_id}", response_model=LearningEvaluationReportRead)
def evaluation_report_detail(
    report_id: int,
    session: SessionDep,
) -> LearningEvaluationReportRead:
    return get_evaluation_report(report_id, session)


@router.get("/analytics", response_model=LearningAnalyticsSummary)
def learning_analytics(
    student_id: int,
    course_id: int,
    session: SessionDep,
) -> LearningAnalyticsSummary:
    return get_learning_analytics_summary(student_id, course_id, session)
