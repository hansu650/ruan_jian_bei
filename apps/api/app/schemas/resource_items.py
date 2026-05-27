from datetime import datetime

from sqlmodel import SQLModel


class ResourceItemCreate(SQLModel):
    course_id: int
    knowledge_point_id: int | None = None
    student_id: int | None = None
    resource_type: str
    title: str
    status: str = "planned"
    content_preview: str | None = None


class ResourceItemRead(ResourceItemCreate):
    id: int
    created_at: datetime
    updated_at: datetime
