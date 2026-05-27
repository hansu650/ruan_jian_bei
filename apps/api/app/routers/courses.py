from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.db.database import get_session
from app.db.models import Course
from app.schemas.courses import CourseCreate, CourseRead

router = APIRouter(prefix="/api/courses", tags=["courses"])
SessionDep = Annotated[Session, Depends(get_session)]


@router.get("", response_model=list[CourseRead])
def list_courses(session: SessionDep) -> list[Course]:
    return list(session.exec(select(Course)).all())


@router.post("", response_model=CourseRead, status_code=status.HTTP_201_CREATED)
def create_course(payload: CourseCreate, session: SessionDep) -> Course:
    course = Course(**payload.model_dump())
    session.add(course)
    session.commit()
    session.refresh(course)
    return course


@router.get("/{course_id}", response_model=CourseRead)
def get_course(course_id: int, session: SessionDep) -> Course:
    course = session.get(Course, course_id)
    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    return course
