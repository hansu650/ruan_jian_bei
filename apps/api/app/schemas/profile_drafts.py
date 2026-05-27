from datetime import datetime

from sqlmodel import SQLModel


class ProfileDraftCreate(SQLModel):
    student_id: int
    course_id: int
    goal: str
    background: str
    weak_points_json: str = "[]"
    preferences_json: str = "[]"
    mastery_json: str = "{}"
    notes: str | None = None


class ProfileDraftRead(ProfileDraftCreate):
    id: int
    created_at: datetime
    updated_at: datetime
