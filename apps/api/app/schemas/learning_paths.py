from datetime import datetime

from pydantic import BaseModel, Field


class LearningPathRead(BaseModel):
    id: int
    student_id: int
    course_id: int
    profile_id: int | None
    title: str
    goal: str
    target_days: int
    status: str
    strategy_summary: str
    weak_points_json: str
    recommended_resource_types_json: str
    version: int
    source: str
    created_at: datetime
    updated_at: datetime


class LearningPathStepRead(BaseModel):
    id: int
    path_id: int
    course_id: int
    order_index: int
    title: str
    objective: str
    knowledge_points_json: str
    prerequisite: str
    estimated_minutes: int
    recommended_resource_types_json: str
    recommended_activity: str
    mastery_threshold: int
    status: str
    created_at: datetime
    updated_at: datetime


class LearningPathDetailResponse(BaseModel):
    path: LearningPathRead
    steps: list[LearningPathStepRead]


class GenerateLearningPathRequest(BaseModel):
    student_id: int
    course_id: int
    profile_id: int | None = None
    target_days: int = Field(default=7, ge=1, le=30)
    regenerate: bool = True


class GenerateLearningPathResponse(BaseModel):
    path: LearningPathRead
    steps: list[LearningPathStepRead]
    agent_run_id: int | None
    llm_log_id: int | None
    generation_summary: str


class LearningPathPlanCheck(BaseModel):
    required_step_count: int
    actual_step_count: int
    has_weak_point_coverage: bool
    covered_weak_points: list[str]
    missing_weak_points: list[str]
    total_estimated_minutes: int
    recommended_resource_types: list[str]
