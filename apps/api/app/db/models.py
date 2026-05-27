from datetime import UTC, datetime

from sqlmodel import Field, SQLModel


def utc_now() -> datetime:
    return datetime.now(UTC)


class Student(SQLModel, table=True):
    __tablename__ = "student"

    id: int | None = Field(default=None, primary_key=True)
    name: str
    major: str
    grade_level: str
    email: str | None = None
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


class Course(SQLModel, table=True):
    __tablename__ = "course"

    id: int | None = Field(default=None, primary_key=True)
    title: str
    description: str
    subject: str
    semester: str | None = None
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


class KnowledgePoint(SQLModel, table=True):
    __tablename__ = "knowledge_point"

    id: int | None = Field(default=None, primary_key=True)
    course_id: int = Field(foreign_key="course.id", index=True)
    title: str
    chapter: str
    order_index: int = 0
    summary: str
    difficulty: str = "medium"
    prerequisites_json: str = "[]"
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


class ProfileDraft(SQLModel, table=True):
    __tablename__ = "profile_draft"

    id: int | None = Field(default=None, primary_key=True)
    student_id: int = Field(foreign_key="student.id", index=True)
    course_id: int = Field(foreign_key="course.id", index=True)
    goal: str
    background: str
    weak_points_json: str = "[]"
    preferences_json: str = "[]"
    mastery_json: str = "{}"
    notes: str | None = None
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


class ResourceItem(SQLModel, table=True):
    __tablename__ = "resource_item"

    id: int | None = Field(default=None, primary_key=True)
    course_id: int = Field(foreign_key="course.id", index=True)
    knowledge_point_id: int | None = Field(
        default=None,
        foreign_key="knowledge_point.id",
        index=True,
    )
    student_id: int | None = Field(default=None, foreign_key="student.id", index=True)
    resource_type: str
    title: str
    status: str = "planned"
    content_preview: str | None = None
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)
