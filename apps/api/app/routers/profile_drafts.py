from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select

from app.db.database import get_session
from app.db.models import Course, ProfileDraft, Student
from app.schemas.profile_drafts import ProfileDraftCreate, ProfileDraftRead

router = APIRouter(prefix="/api/profile-drafts", tags=["profile-drafts"])
SessionDep = Annotated[Session, Depends(get_session)]


def ensure_profile_refs(student_id: int, course_id: int, session: Session) -> None:
    if session.get(Student, student_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    if session.get(Course, course_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")


@router.get("", response_model=list[ProfileDraftRead])
def list_profile_drafts(
    session: SessionDep,
    student_id: int | None = Query(default=None),
    course_id: int | None = Query(default=None),
) -> list[ProfileDraft]:
    statement = select(ProfileDraft)
    if student_id is not None:
        statement = statement.where(ProfileDraft.student_id == student_id)
    if course_id is not None:
        statement = statement.where(ProfileDraft.course_id == course_id)
    return list(session.exec(statement).all())


@router.post("", response_model=ProfileDraftRead, status_code=status.HTTP_201_CREATED)
def create_profile_draft(payload: ProfileDraftCreate, session: SessionDep) -> ProfileDraft:
    ensure_profile_refs(payload.student_id, payload.course_id, session)
    profile_draft = ProfileDraft(**payload.model_dump())
    session.add(profile_draft)
    session.commit()
    session.refresh(profile_draft)
    return profile_draft
