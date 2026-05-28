from pydantic import BaseModel


class DemoStepStatus(BaseModel):
    key: str
    title: str
    description: str
    status: str
    count: int | None = None
    action_label: str
    action_href: str
    message: str


class LLMModeInfo(BaseModel):
    effective_provider: str
    model: str
    use_mock_llm: bool
    spark_http_configured: bool
    spark_model: str | None = None
    mode_label: str
    mode_level: str
    message: str


class DemoStatusResponse(BaseModel):
    student_id: int | None
    course_id: int | None
    student_name: str | None
    course_title: str | None
    llm_mode: LLMModeInfo
    steps: list[DemoStepStatus]
    overall_ready: bool
    next_recommended_step: str | None


class DemoBootstrapResponse(BaseModel):
    student_id: int
    course_id: int
    imported_documents: int
    chunk_count: int
    message: str
