from datetime import datetime
from typing import Any

from pydantic import BaseModel


class TutorSessionRead(BaseModel):
    id: int
    student_id: int
    course_id: int
    profile_id: int | None
    path_id: int | None
    step_id: int | None
    title: str
    topic: str
    status: str
    created_at: datetime
    updated_at: datetime


class TutorMessageRead(BaseModel):
    id: int
    session_id: int
    student_id: int
    course_id: int
    role: str
    content: str
    citations_json: str
    source_chunk_ids_json: str
    related_resource_ids_json: str
    safety_status: str
    verifier_summary: str
    confidence_score: float
    agent_run_id: int | None
    llm_log_id: int | None
    created_at: datetime


class TutorChatRequest(BaseModel):
    student_id: int
    course_id: int
    question: str
    session_id: int | None = None
    profile_id: int | None = None
    path_id: int | None = None
    step_id: int | None = None
    resource_id: int | None = None


class TutorChatResponse(BaseModel):
    session: TutorSessionRead
    user_message: TutorMessageRead
    assistant_message: TutorMessageRead
    answer: str
    citations: list[dict[str, Any]]
    safety_status: str
    verifier_summary: str
    agent_run_id: int | None
    llm_log_id: int | None


class TutorSessionDetailResponse(BaseModel):
    session: TutorSessionRead
    messages: list[TutorMessageRead]


class TutorQualityCheck(BaseModel):
    message_id: int
    has_citations: bool
    citation_count: int
    source_chunk_count: int
    safety_status: str
    confidence_score: float
    issues: list[str]
    suggestion: str


class TutorScenarioInfo(BaseModel):
    key: str
    label: str
    sample_question: str
