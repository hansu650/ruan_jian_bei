from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select

from app.db.database import get_session
from app.db.models import Course, KnowledgePoint, ResourceItem, Student
from app.schemas.resource_items import ResourceItemCreate, ResourceItemRead

router = APIRouter(prefix="/api/resource-items", tags=["resource-items"])
SessionDep = Annotated[Session, Depends(get_session)]


def ensure_resource_refs(payload: ResourceItemCreate, session: Session) -> None:
    if session.get(Course, payload.course_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    if payload.student_id is not None and session.get(Student, payload.student_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    if payload.knowledge_point_id is not None:
        knowledge_point = session.get(KnowledgePoint, payload.knowledge_point_id)
        if knowledge_point is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Knowledge point not found",
            )


@router.get("", response_model=list[ResourceItemRead])
def list_resource_items(
    session: SessionDep,
    course_id: int | None = Query(default=None),
    student_id: int | None = Query(default=None),
    resource_type: str | None = Query(default=None),
) -> list[ResourceItem]:
    statement = select(ResourceItem)
    if course_id is not None:
        statement = statement.where(ResourceItem.course_id == course_id)
    if student_id is not None:
        statement = statement.where(ResourceItem.student_id == student_id)
    if resource_type is not None:
        statement = statement.where(ResourceItem.resource_type == resource_type)
    return list(session.exec(statement).all())


@router.post("", response_model=ResourceItemRead, status_code=status.HTTP_201_CREATED)
def create_resource_item(payload: ResourceItemCreate, session: SessionDep) -> ResourceItem:
    ensure_resource_refs(payload, session)
    resource_item = ResourceItem(**payload.model_dump())
    session.add(resource_item)
    session.commit()
    session.refresh(resource_item)
    return resource_item
