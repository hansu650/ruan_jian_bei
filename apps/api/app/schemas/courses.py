from datetime import datetime

from sqlmodel import SQLModel


class CourseCreate(SQLModel):
    title: str
    description: str
    subject: str
    semester: str | None = None


class CourseRead(CourseCreate):
    id: int
    created_at: datetime
    updated_at: datetime
