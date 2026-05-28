from datetime import datetime

from pydantic import BaseModel


class LearningEvaluationReportRead(BaseModel):
    id: int
    student_id: int
    course_id: int
    profile_id: int | None
    attempt_id: int | None
    title: str
    overall_score: float
    summary: str
    weak_points_json: str
    strengths_json: str
    mastery_delta_json: str
    recommended_resources_json: str
    next_plan_suggestion: str
    created_at: datetime


class LearningAnalyticsSummary(BaseModel):
    student_id: int
    course_id: int
    profile_id: int | None
    latest_mastery_json: str
    quiz_count: int
    attempt_count: int
    average_accuracy: float
    latest_weak_points: list[str]
    latest_recommended_actions: list[str]
    latest_report: LearningEvaluationReportRead | None
