from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, col, select

from app.db.database import get_session
from app.db.models import Course, KnowledgePoint
from app.schemas.knowledge_points import KnowledgePointCreate, KnowledgePointRead

router = APIRouter(prefix="/api/courses/{course_id}/knowledge-points", tags=["knowledge-points"])
SessionDep = Annotated[Session, Depends(get_session)]


def ensure_course(course_id: int, session: Session) -> Course:
    course = session.get(Course, course_id)
    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    return course


@router.get("", response_model=list[KnowledgePointRead])
def list_knowledge_points(course_id: int, session: SessionDep) -> list[KnowledgePoint]:
    ensure_course(course_id, session)
    statement = (
        select(KnowledgePoint)
        .where(KnowledgePoint.course_id == course_id)
        .order_by(col(KnowledgePoint.order_index))
    )
    return list(session.exec(statement).all())


@router.post("", response_model=KnowledgePointRead, status_code=status.HTTP_201_CREATED)
def create_knowledge_point(
    course_id: int,
    payload: KnowledgePointCreate,
    session: SessionDep,
) -> KnowledgePoint:
    ensure_course(course_id, session)
    knowledge_point = KnowledgePoint(course_id=course_id, **payload.model_dump())
    session.add(knowledge_point)
    session.commit()
    session.refresh(knowledge_point)
    return knowledge_point
