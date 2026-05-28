import json
from typing import Any

from fastapi import HTTPException, status
from sqlmodel import Session, col, select

from app.agents.resource_agent import RESOURCE_TYPE_DETAILS, RESOURCE_TYPES, ResourceAgent
from app.db.models import (
    AgentRun,
    Course,
    DocumentChunk,
    GeneratedResource,
    LearnerProfile,
    LearningPath,
    LearningPathStep,
    Student,
)
from app.schemas.documents import DocumentSearchResult
from app.schemas.generated_resources import (
    GeneratedResourceRead,
    GenerateResourceRequest,
    GenerateResourceResponse,
    GenerateStepResourcesRequest,
    GenerateStepResourcesResponse,
    ResourceTypeInfo,
)
from app.services.search_service import search_chunks


def _preview(text: str, limit: int = 500) -> str:
    return " ".join(text.split())[:limit]


def _json_dumps(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"))


def _json_loads(value: str, fallback: Any) -> Any:
    try:
        return json.loads(value)
    except json.JSONDecodeError:
        return fallback


def _read_resource(resource: GeneratedResource) -> GeneratedResourceRead:
    return GeneratedResourceRead.model_validate(resource, from_attributes=True)


def list_resource_types() -> list[ResourceTypeInfo]:
    return [
        ResourceTypeInfo(
            key=key,
            title=value["title"],
            description=value["description"],
            content_format=value["content_format"],
        )
        for key, value in RESOURCE_TYPE_DETAILS.items()
    ]


def _get_student_or_404(session: Session, student_id: int) -> Student:
    student = session.get(Student, student_id)
    if student is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    return student


def _get_course_or_404(session: Session, course_id: int) -> Course:
    course = session.get(Course, course_id)
    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    return course


def _resolve_step(session: Session, step_id: int, course_id: int) -> LearningPathStep:
    step = session.get(LearningPathStep, step_id)
    if step is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Learning path step not found",
        )
    if step.course_id != course_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Step does not belong to the selected course",
        )
    return step


def _resolve_path(session: Session, step: LearningPathStep, student_id: int) -> LearningPath:
    path = session.get(LearningPath, step.path_id)
    if path is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Learning path not found")
    if path.student_id != student_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Learning path does not belong to the selected student",
        )
    return path


def _latest_profile(session: Session, student_id: int, course_id: int) -> LearnerProfile | None:
    return session.exec(
        select(LearnerProfile)
        .where(
            LearnerProfile.student_id == student_id,
            LearnerProfile.course_id == course_id,
        )
        .order_by(col(LearnerProfile.id).desc())
    ).first()


def _resolve_profile(
    session: Session,
    *,
    profile_id: int | None,
    student_id: int,
    course_id: int,
) -> LearnerProfile:
    if profile_id is None:
        profile = _latest_profile(session, student_id, course_id)
        if profile is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="请先生成学习画像",
            )
        return profile

    profile = session.get(LearnerProfile, profile_id)
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Learner profile not found",
        )
    if profile.student_id != student_id or profile.course_id != course_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Profile does not belong to the selected student/course",
        )
    return profile


def _validate_resource_type(resource_type: str) -> None:
    if resource_type not in RESOURCE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported resource_type: {resource_type}",
        )


def _citation_queries(step: LearningPathStep, profile: LearnerProfile) -> list[str]:
    raw_points = _json_loads(step.knowledge_points_json, [])
    weak_points = _json_loads(profile.weak_points_json, [])
    candidates = [
        step.title,
        step.objective,
        *[str(item) for item in raw_points if str(item).strip()],
        *[str(item) for item in weak_points if str(item).strip()],
    ]
    fixed_keywords = ["JOIN", "事务", "幻读", "B+树", "索引", "查询优化", "数据库"]
    queries: list[str] = []
    for candidate in [*candidates, *fixed_keywords]:
        text = str(candidate).strip()
        if text and text not in queries:
            queries.append(text)
    return queries


def _collect_citations(
    *,
    course_id: int,
    step: LearningPathStep,
    profile: LearnerProfile,
    session: Session,
    limit: int = 5,
) -> list[DocumentSearchResult]:
    results: list[DocumentSearchResult] = []
    seen_chunk_ids: set[int] = set()
    for query in _citation_queries(step, profile):
        for item in search_chunks(course_id, query, session, limit=3):
            if item.chunk_id not in seen_chunk_ids:
                seen_chunk_ids.add(item.chunk_id)
                results.append(item)
            if len(results) >= limit:
                return results

    if not results:
        chunks = session.exec(
            select(DocumentChunk)
            .where(DocumentChunk.course_id == course_id)
            .order_by(col(DocumentChunk.id))
            .limit(limit)
        ).all()
        for chunk in chunks:
            results.append(
                DocumentSearchResult(
                    document_id=chunk.document_id,
                    filename="course_document",
                    chunk_id=chunk.id or 0,
                    chunk_index=chunk.chunk_index,
                    section_title=chunk.section_title,
                    content=chunk.content,
                    score=1,
                    metadata_json=chunk.metadata_json,
                )
            )
    return results[:limit]


def _create_agent_run(
    session: Session,
    *,
    student_id: int,
    course_id: int,
    input_text: str,
    output_text: str | None,
    status_value: str,
    latency_ms: int | None,
    llm_log_id: int | None,
    error_message: str | None = None,
) -> AgentRun:
    agent_run = AgentRun(
        agent_name="ResourceAgent",
        student_id=student_id,
        course_id=course_id,
        input_preview=_preview(input_text),
        output_preview=_preview(output_text) if output_text else None,
        status=status_value,
        error_message=_preview(error_message) if error_message else None,
        latency_ms=latency_ms,
        llm_log_id=llm_log_id,
    )
    session.add(agent_run)
    session.commit()
    session.refresh(agent_run)
    return agent_run


def generate_resource(
    request: GenerateResourceRequest,
    session: Session,
) -> GenerateResourceResponse:
    _validate_resource_type(request.resource_type)
    student = _get_student_or_404(session, request.student_id)
    course = _get_course_or_404(session, request.course_id)
    step = _resolve_step(session, request.step_id, request.course_id)
    path = _resolve_path(session, step, request.student_id)
    profile = _resolve_profile(
        session,
        profile_id=request.profile_id,
        student_id=request.student_id,
        course_id=request.course_id,
    )
    citations = _collect_citations(
        course_id=request.course_id,
        step=step,
        profile=profile,
        session=session,
    )
    input_text = (
        f"student_id={request.student_id}; course_id={request.course_id}; "
        f"step_id={request.step_id}; resource_type={request.resource_type}"
    )
    try:
        agent_result = ResourceAgent().run(
            student=student,
            course=course,
            learner_profile=profile,
            learning_path=path,
            step=step,
            resource_type=request.resource_type,
            citations=citations,
            session=session,
        )
    except Exception as exc:
        _create_agent_run(
            session,
            student_id=request.student_id,
            course_id=request.course_id,
            input_text=input_text,
            output_text=None,
            status_value="failed",
            latency_ms=None,
            llm_log_id=None,
            error_message=str(exc),
        )
        raise

    parsed = agent_result.parsed
    resource = GeneratedResource(
        student_id=request.student_id,
        course_id=request.course_id,
        profile_id=profile.id,
        path_id=path.id,
        step_id=step.id or request.step_id,
        resource_type=str(parsed["resource_type"]),
        title=str(parsed["title"]),
        content_format=str(parsed["content_format"]),
        content=str(parsed["content"]),
        citations_json=_json_dumps(parsed["citations"]),
        status="ready",
        source="resource_agent",
        llm_log_id=agent_result.llm_log_id,
    )
    session.add(resource)
    session.commit()
    session.refresh(resource)
    agent_run = _create_agent_run(
        session,
        student_id=request.student_id,
        course_id=request.course_id,
        input_text=input_text,
        output_text=resource.content,
        status_value="success",
        latency_ms=agent_result.latency_ms,
        llm_log_id=agent_result.llm_log_id,
    )
    citations_payload = _json_loads(resource.citations_json, [])
    return GenerateResourceResponse(
        resource=_read_resource(resource),
        agent_run_id=agent_run.id,
        llm_log_id=agent_result.llm_log_id,
        citation_count=len(citations_payload) if isinstance(citations_payload, list) else 0,
        generation_summary=f"已生成 {RESOURCE_TYPE_DETAILS[request.resource_type]['title']}。",
    )


def generate_step_resources(
    request: GenerateStepResourcesRequest,
    session: Session,
) -> GenerateStepResourcesResponse:
    resource_types = request.resource_types or RESOURCE_TYPES
    resources: list[GeneratedResourceRead] = []
    agent_run_ids: list[int] = []
    llm_log_ids: list[int] = []
    for resource_type in resource_types:
        response = generate_resource(
            GenerateResourceRequest(
                student_id=request.student_id,
                course_id=request.course_id,
                step_id=request.step_id,
                resource_type=resource_type,
                profile_id=request.profile_id,
                regenerate=request.regenerate,
            ),
            session,
        )
        resources.append(response.resource)
        if response.agent_run_id is not None:
            agent_run_ids.append(response.agent_run_id)
        if response.llm_log_id is not None:
            llm_log_ids.append(response.llm_log_id)
    return GenerateStepResourcesResponse(
        resources=resources,
        agent_run_ids=agent_run_ids,
        llm_log_ids=llm_log_ids,
        generation_summary=f"已生成 {len(resources)} 类学习资源。",
    )


def list_generated_resources(
    session: Session,
    *,
    student_id: int | None = None,
    course_id: int | None = None,
    path_id: int | None = None,
    step_id: int | None = None,
    resource_type: str | None = None,
) -> list[GeneratedResourceRead]:
    statement = select(GeneratedResource)
    if student_id is not None:
        statement = statement.where(GeneratedResource.student_id == student_id)
    if course_id is not None:
        statement = statement.where(GeneratedResource.course_id == course_id)
    if path_id is not None:
        statement = statement.where(GeneratedResource.path_id == path_id)
    if step_id is not None:
        statement = statement.where(GeneratedResource.step_id == step_id)
    if resource_type is not None:
        statement = statement.where(GeneratedResource.resource_type == resource_type)
    resources = session.exec(statement.order_by(col(GeneratedResource.id).desc())).all()
    return [_read_resource(resource) for resource in resources]


def get_generated_resource(resource_id: int, session: Session) -> GeneratedResourceRead:
    resource = session.get(GeneratedResource, resource_id)
    if resource is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Generated resource not found",
        )
    return _read_resource(resource)
