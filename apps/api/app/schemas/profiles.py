from datetime import datetime
from typing import Any

from pydantic import BaseModel


class LearnerProfileRead(BaseModel):
    id: int
    student_id: int
    course_id: int
    major: str
    learning_goal: str
    knowledge_base: str
    learning_preference_json: str
    cognitive_style: str
    weak_points_json: str
    time_constraint: str
    mastery_json: str
    profile_summary: str
    version: int
    source: str
    created_at: datetime
    updated_at: datetime


class ProfileChatMessageRead(BaseModel):
    id: int
    student_id: int
    course_id: int
    profile_id: int | None
    role: str
    content: str
    created_at: datetime


class ProfileChatRequest(BaseModel):
    student_id: int
    course_id: int
    message: str


class ProfileChatResponse(BaseModel):
    profile: LearnerProfileRead
    assistant_message: str
    extracted_updates: dict[str, Any]
    is_created: bool
    agent_run_id: int | None
    llm_log_id: int | None


class ProfileSummaryResponse(BaseModel):
    profile: LearnerProfileRead | None
    messages: list[ProfileChatMessageRead]


class ProfileDimensionCheck(BaseModel):
    required_dimensions: list[str]
    completed_dimensions: list[str]
    missing_dimensions: list[str]
    completion_rate: float
