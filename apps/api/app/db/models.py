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


class CourseDocument(SQLModel, table=True):
    __tablename__ = "course_document"

    id: int | None = Field(default=None, primary_key=True)
    course_id: int = Field(foreign_key="course.id", index=True)
    filename: str
    original_filename: str
    file_type: str
    source_type: str = "sample"
    storage_path: str | None = None
    status: str = "uploaded"
    chunk_count: int = 0
    error_message: str | None = None
    content_hash: str | None = None
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


class DocumentChunk(SQLModel, table=True):
    __tablename__ = "document_chunk"

    id: int | None = Field(default=None, primary_key=True)
    document_id: int = Field(foreign_key="course_document.id", index=True)
    course_id: int = Field(foreign_key="course.id", index=True)
    chunk_index: int
    section_title: str | None = None
    content: str
    char_count: int
    content_hash: str
    metadata_json: str = "{}"
    created_at: datetime = Field(default_factory=utc_now)


class LLMCallLog(SQLModel, table=True):
    __tablename__ = "llm_call_log"

    id: int | None = Field(default=None, primary_key=True)
    provider: str
    model: str
    scenario: str
    prompt_preview: str
    response_preview: str | None = None
    status: str = "success"
    error_message: str | None = None
    latency_ms: int | None = None
    created_at: datetime = Field(default_factory=utc_now)


class LearnerProfile(SQLModel, table=True):
    __tablename__ = "learner_profile"

    id: int | None = Field(default=None, primary_key=True)
    student_id: int = Field(foreign_key="student.id", index=True)
    course_id: int = Field(foreign_key="course.id", index=True)
    major: str = ""
    learning_goal: str = ""
    knowledge_base: str = ""
    learning_preference_json: str = "[]"
    cognitive_style: str = ""
    weak_points_json: str = "[]"
    time_constraint: str = ""
    mastery_json: str = "{}"
    profile_summary: str = ""
    version: int = 1
    source: str = "profile_agent"
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


class ProfileChatMessage(SQLModel, table=True):
    __tablename__ = "profile_chat_message"

    id: int | None = Field(default=None, primary_key=True)
    student_id: int = Field(foreign_key="student.id", index=True)
    course_id: int = Field(foreign_key="course.id", index=True)
    profile_id: int | None = Field(
        default=None,
        foreign_key="learner_profile.id",
        index=True,
    )
    role: str
    content: str
    created_at: datetime = Field(default_factory=utc_now)


class AgentRun(SQLModel, table=True):
    __tablename__ = "agent_run"

    id: int | None = Field(default=None, primary_key=True)
    agent_name: str
    student_id: int | None = Field(default=None, foreign_key="student.id", index=True)
    course_id: int | None = Field(default=None, foreign_key="course.id", index=True)
    input_preview: str
    output_preview: str | None = None
    status: str = "success"
    error_message: str | None = None
    latency_ms: int | None = None
    llm_log_id: int | None = Field(default=None, foreign_key="llm_call_log.id", index=True)
    created_at: datetime = Field(default_factory=utc_now)


class LearningPath(SQLModel, table=True):
    __tablename__ = "learning_path"

    id: int | None = Field(default=None, primary_key=True)
    student_id: int = Field(foreign_key="student.id", index=True)
    course_id: int = Field(foreign_key="course.id", index=True)
    profile_id: int | None = Field(default=None, foreign_key="learner_profile.id", index=True)
    title: str
    goal: str
    target_days: int = 7
    status: str = "active"
    strategy_summary: str = ""
    weak_points_json: str = "[]"
    recommended_resource_types_json: str = "[]"
    version: int = 1
    source: str = "planner_agent"
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


class LearningPathStep(SQLModel, table=True):
    __tablename__ = "learning_path_step"

    id: int | None = Field(default=None, primary_key=True)
    path_id: int = Field(foreign_key="learning_path.id", index=True)
    course_id: int = Field(foreign_key="course.id", index=True)
    order_index: int
    title: str
    objective: str
    knowledge_points_json: str = "[]"
    prerequisite: str = ""
    estimated_minutes: int = 60
    recommended_resource_types_json: str = "[]"
    recommended_activity: str = ""
    mastery_threshold: int = 80
    status: str = "pending"
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


class GeneratedResource(SQLModel, table=True):
    __tablename__ = "generated_resource"

    id: int | None = Field(default=None, primary_key=True)
    student_id: int = Field(foreign_key="student.id", index=True)
    course_id: int = Field(foreign_key="course.id", index=True)
    profile_id: int | None = Field(default=None, foreign_key="learner_profile.id", index=True)
    path_id: int | None = Field(default=None, foreign_key="learning_path.id", index=True)
    step_id: int = Field(foreign_key="learning_path_step.id", index=True)
    resource_type: str
    title: str
    content_format: str = "markdown"
    content: str
    citations_json: str = "[]"
    status: str = "ready"
    source: str = "resource_agent"
    llm_log_id: int | None = Field(default=None, foreign_key="llm_call_log.id", index=True)
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


class PracticeQuiz(SQLModel, table=True):
    __tablename__ = "practice_quiz"

    id: int | None = Field(default=None, primary_key=True)
    student_id: int = Field(foreign_key="student.id", index=True)
    course_id: int = Field(foreign_key="course.id", index=True)
    profile_id: int | None = Field(default=None, foreign_key="learner_profile.id", index=True)
    path_id: int | None = Field(default=None, foreign_key="learning_path.id", index=True)
    step_id: int | None = Field(default=None, foreign_key="learning_path_step.id", index=True)
    title: str
    description: str = ""
    difficulty: str = "medium"
    status: str = "ready"
    question_count: int = 0
    knowledge_points_json: str = "[]"
    source_resource_ids_json: str = "[]"
    source_chunk_ids_json: str = "[]"
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


class PracticeQuestion(SQLModel, table=True):
    __tablename__ = "practice_question"

    id: int | None = Field(default=None, primary_key=True)
    quiz_id: int = Field(foreign_key="practice_quiz.id", index=True)
    course_id: int = Field(foreign_key="course.id", index=True)
    step_id: int | None = Field(default=None, foreign_key="learning_path_step.id", index=True)
    order_index: int
    question_type: str
    stem: str
    options_json: str = "[]"
    correct_answer_json: str = "{}"
    explanation: str = ""
    knowledge_point: str = ""
    difficulty: str = "medium"
    score: int = 10
    citations_json: str = "[]"
    created_at: datetime = Field(default_factory=utc_now)


class PracticeAttempt(SQLModel, table=True):
    __tablename__ = "practice_attempt"

    id: int | None = Field(default=None, primary_key=True)
    quiz_id: int = Field(foreign_key="practice_quiz.id", index=True)
    student_id: int = Field(foreign_key="student.id", index=True)
    course_id: int = Field(foreign_key="course.id", index=True)
    profile_id: int | None = Field(default=None, foreign_key="learner_profile.id", index=True)
    status: str = "submitted"
    total_score: int = 0
    max_score: int = 0
    accuracy: float = 0.0
    weak_points_json: str = "[]"
    mastery_before_json: str = "{}"
    mastery_after_json: str = "{}"
    feedback_summary: str = ""
    recommended_actions_json: str = "[]"
    agent_run_id: int | None = Field(default=None, foreign_key="agent_run.id", index=True)
    llm_log_id: int | None = Field(default=None, foreign_key="llm_call_log.id", index=True)
    created_at: datetime = Field(default_factory=utc_now)
    graded_at: datetime | None = None


class PracticeAnswer(SQLModel, table=True):
    __tablename__ = "practice_answer"

    id: int | None = Field(default=None, primary_key=True)
    attempt_id: int = Field(foreign_key="practice_attempt.id", index=True)
    question_id: int = Field(foreign_key="practice_question.id", index=True)
    answer_json: str = "{}"
    is_correct: bool = False
    score_awarded: int = 0
    max_score: int = 0
    feedback: str = ""
    mistake_reason: str = ""
    related_knowledge_point: str = ""
    created_at: datetime = Field(default_factory=utc_now)


class LearningEvaluationReport(SQLModel, table=True):
    __tablename__ = "learning_evaluation_report"

    id: int | None = Field(default=None, primary_key=True)
    student_id: int = Field(foreign_key="student.id", index=True)
    course_id: int = Field(foreign_key="course.id", index=True)
    profile_id: int | None = Field(default=None, foreign_key="learner_profile.id", index=True)
    attempt_id: int | None = Field(default=None, foreign_key="practice_attempt.id", index=True)
    title: str
    overall_score: float = 0.0
    summary: str = ""
    weak_points_json: str = "[]"
    strengths_json: str = "[]"
    mastery_delta_json: str = "{}"
    recommended_resources_json: str = "[]"
    next_plan_suggestion: str = ""
    created_at: datetime = Field(default_factory=utc_now)


class TutorSession(SQLModel, table=True):
    __tablename__ = "tutor_session"

    id: int | None = Field(default=None, primary_key=True)
    student_id: int = Field(foreign_key="student.id", index=True)
    course_id: int = Field(foreign_key="course.id", index=True)
    profile_id: int | None = Field(default=None, foreign_key="learner_profile.id", index=True)
    path_id: int | None = Field(default=None, foreign_key="learning_path.id", index=True)
    step_id: int | None = Field(default=None, foreign_key="learning_path_step.id", index=True)
    title: str = "智能辅导会话"
    topic: str = ""
    status: str = "active"
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


class TutorMessage(SQLModel, table=True):
    __tablename__ = "tutor_message"

    id: int | None = Field(default=None, primary_key=True)
    session_id: int = Field(foreign_key="tutor_session.id", index=True)
    student_id: int = Field(foreign_key="student.id", index=True)
    course_id: int = Field(foreign_key="course.id", index=True)
    role: str
    content: str
    citations_json: str = "[]"
    source_chunk_ids_json: str = "[]"
    related_resource_ids_json: str = "[]"
    safety_status: str = "grounded"
    verifier_summary: str = ""
    confidence_score: float = 0.0
    agent_run_id: int | None = Field(default=None, foreign_key="agent_run.id", index=True)
    llm_log_id: int | None = Field(default=None, foreign_key="llm_call_log.id", index=True)
    created_at: datetime = Field(default_factory=utc_now)
