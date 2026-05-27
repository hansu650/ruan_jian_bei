from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.db.database import get_session
from app.db.models import Student
from app.schemas.students import StudentCreate, StudentRead

router = APIRouter(prefix="/api/students", tags=["students"])
SessionDep = Annotated[Session, Depends(get_session)]


@router.get("", response_model=list[StudentRead])
def list_students(session: SessionDep) -> list[Student]:
    return list(session.exec(select(Student)).all())


@router.post("", response_model=StudentRead, status_code=status.HTTP_201_CREATED)
def create_student(payload: StudentCreate, session: SessionDep) -> Student:
    student = Student(**payload.model_dump())
    session.add(student)
    session.commit()
    session.refresh(student)
    return student


@router.get("/{student_id}", response_model=StudentRead)
def get_student(student_id: int, session: SessionDep) -> Student:
    student = session.get(Student, student_id)
    if student is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    return student
