from datetime import datetime

from pydantic import BaseModel


class AgentRunRead(BaseModel):
    id: int
    agent_name: str
    student_id: int | None
    course_id: int | None
    input_preview: str
    output_preview: str | None
    status: str
    error_message: str | None
    latency_ms: int | None
    llm_log_id: int | None
    created_at: datetime
