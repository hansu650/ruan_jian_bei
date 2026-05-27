from datetime import datetime

from sqlmodel import SQLModel


class StudentCreate(SQLModel):
    name: str
    major: str
    grade_level: str
    email: str | None = None


class StudentRead(StudentCreate):
    id: int
    created_at: datetime
    updated_at: datetime
