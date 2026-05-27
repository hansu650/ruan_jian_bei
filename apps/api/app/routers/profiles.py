from typing import Annotated

from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.db.database import get_session
from app.schemas.profiles import (
    LearnerProfileRead,
    ProfileChatRequest,
    ProfileChatResponse,
    ProfileDimensionCheck,
    ProfileSummaryResponse,
)
from app.services.profile_service import (
    chat_with_profile_agent,
    get_dimension_check,
    get_learner_profile,
    get_profile_summary,
    list_learner_profiles,
)

router = APIRouter(prefix="/api/learner-profiles", tags=["learner-profiles"])
SessionDep = Annotated[Session, Depends(get_session)]


@router.get("", response_model=list[LearnerProfileRead])
def learner_profiles(
    session: SessionDep,
    student_id: int | None = None,
    course_id: int | None = None,
) -> list[LearnerProfileRead]:
    return list_learner_profiles(session, student_id=student_id, course_id=course_id)


@router.post("/chat", response_model=ProfileChatResponse)
def profile_chat(request: ProfileChatRequest, session: SessionDep) -> ProfileChatResponse:
    return chat_with_profile_agent(request, session)


@router.get("/summary/by-student-course", response_model=ProfileSummaryResponse)
def profile_summary(
    session: SessionDep,
    student_id: int,
    course_id: int,
) -> ProfileSummaryResponse:
    return get_profile_summary(session, student_id=student_id, course_id=course_id)


@router.get("/dimension-check/by-student-course", response_model=ProfileDimensionCheck)
def profile_dimension_check(
    session: SessionDep,
    student_id: int,
    course_id: int,
) -> ProfileDimensionCheck:
    return get_dimension_check(session, student_id=student_id, course_id=course_id)


@router.get("/{profile_id}", response_model=LearnerProfileRead)
def learner_profile(profile_id: int, session: SessionDep) -> LearnerProfileRead:
    return get_learner_profile(session, profile_id)
