from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class ResourceTypeInfo(BaseModel):
    key: str
    title: str
    description: str
    content_format: str


class ResourceCitation(BaseModel):
    chunk_id: int
    document_id: int
    filename: str
    chunk_index: int
    section_title: str | None = None
    quote_preview: str


class GeneratedResourceRead(BaseModel):
    id: int
    student_id: int
    course_id: int
    profile_id: int | None
    path_id: int | None
    step_id: int
    resource_type: str
    title: str
    content_format: str
    content: str
    citations_json: str
    status: str
    source: str
    llm_log_id: int | None
    created_at: datetime
    updated_at: datetime


class GenerateResourceRequest(BaseModel):
    student_id: int
    course_id: int
    step_id: int
    resource_type: str
    profile_id: int | None = None
    regenerate: bool = True


class GenerateStepResourcesRequest(BaseModel):
    student_id: int
    course_id: int
    step_id: int
    profile_id: int | None = None
    resource_types: list[str] = Field(default_factory=list)
    regenerate: bool = True


class GenerateResourceResponse(BaseModel):
    resource: GeneratedResourceRead
    agent_run_id: int | None
    llm_log_id: int | None
    citation_count: int
    generation_summary: str


class GenerateStepResourcesResponse(BaseModel):
    resources: list[GeneratedResourceRead]
    agent_run_ids: list[int]
    llm_log_ids: list[int]
    generation_summary: str


class ResourceGenerationPreview(BaseModel):
    resource_type: str
    title: str
    content_format: str
    content: str
    citations: list[ResourceCitation]
    metadata: dict[str, Any] = Field(default_factory=dict)
