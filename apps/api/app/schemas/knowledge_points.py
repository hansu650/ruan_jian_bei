from datetime import datetime

from sqlmodel import SQLModel


class KnowledgePointCreate(SQLModel):
    title: str
    chapter: str
    order_index: int = 0
    summary: str
    difficulty: str = "medium"
    prerequisites_json: str = "[]"


class KnowledgePointRead(KnowledgePointCreate):
    id: int
    course_id: int
    created_at: datetime
    updated_at: datetime
