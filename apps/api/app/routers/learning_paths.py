from typing import Annotated

from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.db.database import get_session
from app.schemas.learning_paths import (
    GenerateLearningPathRequest,
    GenerateLearningPathResponse,
    LearningPathDetailResponse,
    LearningPathPlanCheck,
    LearningPathRead,
    LearningPathStepRead,
)
from app.services.learning_path_service import (
    generate_learning_path,
    get_learning_path_detail,
    get_learning_path_plan_check,
    list_learning_path_steps,
    list_learning_paths,
)

router = APIRouter(prefix="/api/learning-paths", tags=["learning-paths"])
SessionDep = Annotated[Session, Depends(get_session)]


@router.post("/generate", response_model=GenerateLearningPathResponse)
def generate_path(
    request: GenerateLearningPathRequest,
    session: SessionDep,
) -> GenerateLearningPathResponse:
    return generate_learning_path(request, session)


@router.get("", response_model=list[LearningPathRead])
def learning_paths(
    session: SessionDep,
    student_id: int | None = None,
    course_id: int | None = None,
) -> list[LearningPathRead]:
    return list_learning_paths(session, student_id=student_id, course_id=course_id)


@router.get("/{path_id}", response_model=LearningPathDetailResponse)
def learning_path_detail(path_id: int, session: SessionDep) -> LearningPathDetailResponse:
    return get_learning_path_detail(path_id, session)


@router.get("/{path_id}/steps", response_model=list[LearningPathStepRead])
def learning_path_steps(path_id: int, session: SessionDep) -> list[LearningPathStepRead]:
    return list_learning_path_steps(path_id, session)


@router.get("/{path_id}/plan-check", response_model=LearningPathPlanCheck)
def learning_path_plan_check(path_id: int, session: SessionDep) -> LearningPathPlanCheck:
    return get_learning_path_plan_check(path_id, session)
