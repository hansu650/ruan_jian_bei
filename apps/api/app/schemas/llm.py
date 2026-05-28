from datetime import datetime

from pydantic import BaseModel, Field


class LLMStatusResponse(BaseModel):
    provider: str
    model: str
    use_mock_llm: bool
    effective_provider: str
    spark_configured: bool
    spark_http_configured: bool
    status: str
    warning: str | None = None


class LLMMessage(BaseModel):
    role: str
    content: str


class LLMChatRequest(BaseModel):
    messages: list[LLMMessage]
    scenario: str = "general"
    temperature: float = Field(default=0.2, ge=0.0, le=1.0)


class LLMChatResponse(BaseModel):
    content: str
    provider: str
    model: str
    scenario: str
    used_mock: bool
    latency_ms: int
    log_id: int | None


class LLMGenerateRequest(BaseModel):
    prompt: str
    system_prompt: str | None = None
    scenario: str = "general"
    temperature: float = Field(default=0.2, ge=0.0, le=1.0)


class LLMGenerateResponse(BaseModel):
    content: str
    provider: str
    model: str
    scenario: str
    used_mock: bool
    latency_ms: int
    log_id: int | None


class LLMScenario(BaseModel):
    key: str
    title: str
    description: str
    sample_prompt: str


class LLMCallLogRead(BaseModel):
    id: int
    provider: str
    model: str
    scenario: str
    prompt_preview: str
    response_preview: str | None
    status: str
    error_message: str | None
    latency_ms: int | None
    created_at: datetime
