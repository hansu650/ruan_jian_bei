from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class PracticeQuizRead(BaseModel):
    id: int
    student_id: int
    course_id: int
    profile_id: int | None
    path_id: int | None
    step_id: int | None
    title: str
    description: str
    difficulty: str
    status: str
    question_count: int
    knowledge_points_json: str
    source_resource_ids_json: str
    source_chunk_ids_json: str
    created_at: datetime
    updated_at: datetime


class PracticeQuestionRead(BaseModel):
    id: int
    quiz_id: int
    course_id: int
    step_id: int | None
    order_index: int
    question_type: str
    stem: str
    options_json: str
    explanation: str
    knowledge_point: str
    difficulty: str
    score: int
    citations_json: str
    created_at: datetime


class PracticeQuestionWithAnswerRead(PracticeQuestionRead):
    correct_answer_json: str


class GenerateQuizRequest(BaseModel):
    student_id: int
    course_id: int
    step_id: int
    profile_id: int | None = None
    path_id: int | None = None
    difficulty: str = "medium"
    question_count: int = Field(default=6, ge=1, le=20)
    question_types: list[str] | None = None


class GenerateQuizResponse(BaseModel):
    quiz: PracticeQuizRead
    questions: list[PracticeQuestionRead]
    agent_run_id: int | None
    llm_log_id: int | None
    generation_summary: str


class SubmitAnswerItem(BaseModel):
    question_id: int
    answer: dict[str, Any]


class SubmitQuizRequest(BaseModel):
    student_id: int
    quiz_id: int
    answers: list[SubmitAnswerItem]


class PracticeAnswerRead(BaseModel):
    id: int
    attempt_id: int
    question_id: int
    answer_json: str
    is_correct: bool
    score_awarded: int
    max_score: int
    feedback: str
    mistake_reason: str
    related_knowledge_point: str
    created_at: datetime


class PracticeAttemptRead(BaseModel):
    id: int
    quiz_id: int
    student_id: int
    course_id: int
    profile_id: int | None
    status: str
    total_score: int
    max_score: int
    accuracy: float
    weak_points_json: str
    mastery_before_json: str
    mastery_after_json: str
    feedback_summary: str
    recommended_actions_json: str
    agent_run_id: int | None
    llm_log_id: int | None
    created_at: datetime
    graded_at: datetime | None


class SubmitQuizResponse(BaseModel):
    attempt: PracticeAttemptRead
    answers: list[PracticeAnswerRead]
    evaluation_report_id: int | None
    updated_profile_id: int | None


class PracticeQuizDetailResponse(BaseModel):
    quiz: PracticeQuizRead
    questions: list[PracticeQuestionRead]


class PracticeAttemptDetailResponse(BaseModel):
    attempt: PracticeAttemptRead
    quiz: PracticeQuizRead
    questions: list[PracticeQuestionWithAnswerRead]
    answers: list[PracticeAnswerRead]


class QuestionTypeInfo(BaseModel):
    key: str
    label: str
    description: str
