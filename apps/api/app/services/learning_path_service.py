import json
from typing import Any

from fastapi import HTTPException, status
from sqlmodel import Session, col, select

from app.agents.planner_agent import PlannerAgent
from app.db.models import (
    AgentRun,
    Course,
    DocumentChunk,
    KnowledgePoint,
    LearnerProfile,
    LearningPath,
    LearningPathStep,
    Student,
)
from app.schemas.learning_paths import (
    GenerateLearningPathRequest,
    GenerateLearningPathResponse,
    LearningPathDetailResponse,
    LearningPathPlanCheck,
    LearningPathRead,
    LearningPathStepRead,
)


def _preview(text: str, limit: int = 500) -> str:
    return " ".join(text.split())[:limit]


def _json_dumps(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"))


def _json_loads(value: str, fallback: Any) -> Any:
    try:
        return json.loads(value)
    except json.JSONDecodeError:
        return fallback


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


def _read_path(path: LearningPath) -> LearningPathRead:
    return LearningPathRead.model_validate(path, from_attributes=True)


def _read_step(step: LearningPathStep) -> LearningPathStepRead:
    return LearningPathStepRead.model_validate(step, from_attributes=True)


def _find_latest_profile(
    session: Session,
    *,
    student_id: int,
    course_id: int,
) -> LearnerProfile | None:
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
    request: GenerateLearningPathRequest,
) -> LearnerProfile:
    if request.profile_id is None:
        profile = _find_latest_profile(
            session,
            student_id=request.student_id,
            course_id=request.course_id,
        )
        if profile is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="请先生成学习画像",
            )
        return profile

    profile = session.get(LearnerProfile, request.profile_id)
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Learner profile not found",
        )
    if profile.student_id != request.student_id or profile.course_id != request.course_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Profile does not belong to the selected student/course",
        )
    return profile


def _course_knowledge_points(session: Session, course_id: int) -> list[KnowledgePoint]:
    return list(
        session.exec(
            select(KnowledgePoint)
            .where(KnowledgePoint.course_id == course_id)
            .order_by(col(KnowledgePoint.order_index))
        ).all()
    )


def _document_summaries(session: Session, course_id: int) -> list[DocumentChunk]:
    return list(
        session.exec(
            select(DocumentChunk)
            .where(DocumentChunk.course_id == course_id)
            .order_by(col(DocumentChunk.id))
            .limit(12)
        ).all()
    )


def _create_agent_run(
    session: Session,
    *,
    student_id: int | None,
    course_id: int | None,
    input_text: str,
    output_text: str | None,
    status_value: str,
    latency_ms: int | None,
    llm_log_id: int | None,
    error_message: str | None = None,
) -> AgentRun:
    agent_run = AgentRun(
        agent_name="PlannerAgent",
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


def generate_learning_path(
    request: GenerateLearningPathRequest,
    session: Session,
) -> GenerateLearningPathResponse:
    student = _get_student_or_404(session, request.student_id)
    course = _get_course_or_404(session, request.course_id)
    profile = _resolve_profile(session, request)
    knowledge_points = _course_knowledge_points(session, request.course_id)
    document_chunks = _document_summaries(session, request.course_id)
    input_text = (
        f"student_id={request.student_id}; course_id={request.course_id}; "
        f"profile_id={profile.id}; target_days={request.target_days}"
    )

    try:
        agent_result = PlannerAgent().run(
            student=student,
            course=course,
            learner_profile=profile,
            knowledge_points=knowledge_points,
            document_chunk_summaries=document_chunks,
            target_days=request.target_days,
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

    plan = agent_result.parsed
    path = LearningPath(
        student_id=request.student_id,
        course_id=request.course_id,
        profile_id=profile.id,
        title=str(plan["title"]),
        goal=str(plan["goal"]),
        target_days=int(plan["target_days"]),
        status="active",
        strategy_summary=str(plan["strategy_summary"]),
        weak_points_json=_json_dumps(plan["weak_points"]),
        recommended_resource_types_json=_json_dumps(plan["recommended_resource_types"]),
    )
    session.add(path)
    session.commit()
    session.refresh(path)
    if path.id is None:
        raise RuntimeError("Failed to create learning path.")

    steps: list[LearningPathStep] = []
    for raw_step in plan["steps"]:
        step = LearningPathStep(
            path_id=path.id,
            course_id=request.course_id,
            order_index=int(raw_step["order_index"]),
            title=str(raw_step["title"]),
            objective=str(raw_step["objective"]),
            knowledge_points_json=_json_dumps(raw_step["knowledge_points"]),
            prerequisite=str(raw_step["prerequisite"]),
            estimated_minutes=int(raw_step["estimated_minutes"]),
            recommended_resource_types_json=_json_dumps(raw_step["recommended_resource_types"]),
            recommended_activity=str(raw_step["recommended_activity"]),
            mastery_threshold=int(raw_step["mastery_threshold"]),
            status="pending",
        )
        session.add(step)
        steps.append(step)
    session.commit()
    for step in steps:
        session.refresh(step)

    agent_run = _create_agent_run(
        session,
        student_id=request.student_id,
        course_id=request.course_id,
        input_text=input_text,
        output_text=path.strategy_summary,
        status_value="success",
        latency_ms=agent_result.latency_ms,
        llm_log_id=agent_result.llm_log_id,
    )
    return GenerateLearningPathResponse(
        path=_read_path(path),
        steps=[_read_step(step) for step in sorted(steps, key=lambda item: item.order_index)],
        agent_run_id=agent_run.id,
        llm_log_id=agent_result.llm_log_id,
        generation_summary=path.strategy_summary,
    )


def list_learning_paths(
    session: Session,
    *,
    student_id: int | None = None,
    course_id: int | None = None,
) -> list[LearningPathRead]:
    statement = select(LearningPath)
    if student_id is not None:
        statement = statement.where(LearningPath.student_id == student_id)
    if course_id is not None:
        statement = statement.where(LearningPath.course_id == course_id)
    paths = session.exec(statement.order_by(col(LearningPath.id).desc())).all()
    return [_read_path(path) for path in paths]


def get_learning_path_detail(path_id: int, session: Session) -> LearningPathDetailResponse:
    path = session.get(LearningPath, path_id)
    if path is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Learning path not found",
        )
    return LearningPathDetailResponse(
        path=_read_path(path),
        steps=list_learning_path_steps(path_id, session),
    )


def list_learning_path_steps(path_id: int, session: Session) -> list[LearningPathStepRead]:
    path = session.get(LearningPath, path_id)
    if path is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Learning path not found",
        )
    steps = session.exec(
        select(LearningPathStep)
        .where(LearningPathStep.path_id == path_id)
        .order_by(col(LearningPathStep.order_index))
    ).all()
    return [_read_step(step) for step in steps]


def get_learning_path_plan_check(path_id: int, session: Session) -> LearningPathPlanCheck:
    path = session.get(LearningPath, path_id)
    if path is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Learning path not found",
        )
    steps = session.exec(
        select(LearningPathStep)
        .where(LearningPathStep.path_id == path_id)
        .order_by(col(LearningPathStep.order_index))
    ).all()
    weak_points = _json_loads(path.weak_points_json, [])
    haystack = "\n".join(
        "\n".join(
            [
                step.title,
                step.objective,
                step.knowledge_points_json,
                step.recommended_activity,
            ]
        )
        for step in steps
    )
    covered = [point for point in weak_points if _contains_weak_point(haystack, str(point))]
    missing = [str(point) for point in weak_points if str(point) not in covered]
    resource_types: list[str] = []
    for step in steps:
        for item in _json_loads(step.recommended_resource_types_json, []):
            text = str(item)
            if text not in resource_types:
                resource_types.append(text)
    required_step_count = max(5, min(path.target_days, 7))
    return LearningPathPlanCheck(
        required_step_count=required_step_count,
        actual_step_count=len(steps),
        has_weak_point_coverage=not missing,
        covered_weak_points=covered,
        missing_weak_points=missing,
        total_estimated_minutes=sum(step.estimated_minutes for step in steps),
        recommended_resource_types=resource_types,
    )


def _contains_weak_point(text: str, weak_point: str) -> bool:
    aliases = {
        "JOIN": ["JOIN", "连接"],
        "事务隔离级别": ["事务", "隔离"],
        "B+树索引": ["B+树", "B+ 树", "索引"],
        "查询优化": ["查询优化", "执行计划"],
    }
    candidates = aliases.get(weak_point, [weak_point])
    return any(candidate.lower() in text.lower() for candidate in candidates)
