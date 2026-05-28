import json
from typing import Any

from fastapi import HTTPException, status
from sqlmodel import Session, col, select

from app.agents.citation_verifier import CitationVerifier
from app.agents.tutor_agent import TutorAgent
from app.db.models import (
    AgentRun,
    Course,
    GeneratedResource,
    LearnerProfile,
    LearningPath,
    LearningPathStep,
    Student,
    TutorMessage,
    TutorSession,
    utc_now,
)
from app.schemas.documents import DocumentSearchResult
from app.schemas.tutor import (
    TutorChatRequest,
    TutorChatResponse,
    TutorMessageRead,
    TutorQualityCheck,
    TutorScenarioInfo,
    TutorSessionDetailResponse,
    TutorSessionRead,
)
from app.services.search_service import search_chunks

TUTOR_SCENARIOS = [
    TutorScenarioInfo(
        key="phantom_read",
        label="幻读辨析",
        sample_question="幻读和不可重复读有什么区别？",
    ),
    TutorScenarioInfo(
        key="btree_range",
        label="B+树范围查询",
        sample_question="B+树为什么适合范围查询？",
    ),
    TutorScenarioInfo(
        key="join_compare",
        label="JOIN 对比",
        sample_question="LEFT JOIN 和 INNER JOIN 有什么区别？",
    ),
    TutorScenarioInfo(
        key="transaction_review",
        label="事务复习",
        sample_question="我该怎么复习事务隔离级别？",
    ),
    TutorScenarioInfo(
        key="index_design",
        label="索引判断",
        sample_question="如何判断一个 SQL 查询是否适合建索引？",
    ),
]


def _preview(text: str, limit: int = 500) -> str:
    return " ".join(text.split())[:limit]


def _json_dumps(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"))


def _json_loads(value: str, fallback: Any) -> Any:
    try:
        return json.loads(value)
    except json.JSONDecodeError:
        return fallback


def _read_session(tutor_session: TutorSession) -> TutorSessionRead:
    return TutorSessionRead.model_validate(tutor_session, from_attributes=True)


def _read_message(message: TutorMessage) -> TutorMessageRead:
    return TutorMessageRead.model_validate(message, from_attributes=True)


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


def _latest_profile(
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
    *,
    profile_id: int | None,
    student_id: int,
    course_id: int,
) -> LearnerProfile | None:
    if profile_id is None:
        return _latest_profile(session, student_id=student_id, course_id=course_id)

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


def _resolve_path(
    session: Session,
    *,
    path_id: int | None,
    student_id: int,
    course_id: int,
) -> LearningPath | None:
    if path_id is None:
        return None
    path = session.get(LearningPath, path_id)
    if path is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Learning path not found")
    if path.student_id != student_id or path.course_id != course_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Learning path does not belong to the selected student/course",
        )
    return path


def _resolve_step(
    session: Session,
    *,
    step_id: int | None,
    course_id: int,
    path: LearningPath | None,
) -> LearningPathStep | None:
    if step_id is None:
        return None
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
    if path is not None and step.path_id != path.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Step does not belong to the selected learning path",
        )
    return step


def _resolve_resource(
    session: Session,
    *,
    resource_id: int | None,
    student_id: int,
    course_id: int,
) -> GeneratedResource | None:
    if resource_id is None:
        return None
    resource = session.get(GeneratedResource, resource_id)
    if resource is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Generated resource not found",
        )
    if resource.student_id != student_id or resource.course_id != course_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Generated resource does not belong to the selected student/course",
        )
    return resource


def _resolve_session(
    session: Session,
    *,
    request: TutorChatRequest,
    profile: LearnerProfile | None,
    path: LearningPath | None,
    step: LearningPathStep | None,
) -> TutorSession:
    if request.session_id is not None:
        tutor_session = session.get(TutorSession, request.session_id)
        if tutor_session is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tutor session not found",
            )
        if (
            tutor_session.student_id != request.student_id
            or tutor_session.course_id != request.course_id
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tutor session does not belong to the selected student/course",
            )
        return tutor_session

    topic = request.question.strip()[:40]
    tutor_session = TutorSession(
        student_id=request.student_id,
        course_id=request.course_id,
        profile_id=profile.id if profile else None,
        path_id=path.id if path else request.path_id,
        step_id=step.id if step else request.step_id,
        title="智能辅导会话",
        topic=topic,
        status="active",
    )
    session.add(tutor_session)
    session.commit()
    session.refresh(tutor_session)
    return tutor_session


def _query_candidates(question: str, step: LearningPathStep | None) -> list[str]:
    candidates = [question]
    keyword_map = {
        "幻读": ["幻读", "不可重复读", "事务隔离级别"],
        "不可重复读": ["不可重复读", "幻读"],
        "B+树": ["B+树", "B+ 树", "范围查询", "索引"],
        "B+ 树": ["B+树", "B+ 树", "范围查询", "索引"],
        "JOIN": ["JOIN", "INNER JOIN", "LEFT JOIN", "连接条件"],
        "LEFT JOIN": ["LEFT JOIN", "INNER JOIN", "JOIN"],
        "INNER JOIN": ["INNER JOIN", "LEFT JOIN", "JOIN"],
        "事务": ["事务", "事务隔离级别", "ACID"],
        "索引": ["索引", "B+树", "最左前缀"],
    }
    for keyword, queries in keyword_map.items():
        if keyword.upper() in question.upper():
            candidates.extend(queries)
    if step is not None:
        candidates.extend([step.title, step.objective, step.knowledge_points_json])

    unique: list[str] = []
    for candidate in candidates:
        text = str(candidate).strip()
        if text and text not in unique:
            unique.append(text)
    return unique


def _collect_citations(
    *,
    course_id: int,
    question: str,
    step: LearningPathStep | None,
    session: Session,
    limit: int = 5,
) -> list[DocumentSearchResult]:
    results: list[DocumentSearchResult] = []
    seen: set[int] = set()
    for query in _query_candidates(question, step):
        for item in search_chunks(course_id, query, session, limit=3):
            if item.chunk_id not in seen:
                seen.add(item.chunk_id)
                results.append(item)
            if len(results) >= limit:
                return results
    return results


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
        agent_name="TutorAgent",
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


def list_tutor_scenarios() -> list[TutorScenarioInfo]:
    return TUTOR_SCENARIOS


def chat_with_tutor(request: TutorChatRequest, session: Session) -> TutorChatResponse:
    student = _get_student_or_404(session, request.student_id)
    course = _get_course_or_404(session, request.course_id)
    profile = _resolve_profile(
        session,
        profile_id=request.profile_id,
        student_id=request.student_id,
        course_id=request.course_id,
    )
    path = _resolve_path(
        session,
        path_id=request.path_id,
        student_id=request.student_id,
        course_id=request.course_id,
    )
    step = _resolve_step(
        session,
        step_id=request.step_id,
        course_id=request.course_id,
        path=path,
    )
    resource = _resolve_resource(
        session,
        resource_id=request.resource_id,
        student_id=request.student_id,
        course_id=request.course_id,
    )
    tutor_session = _resolve_session(
        session,
        request=request,
        profile=profile,
        path=path,
        step=step,
    )
    user_message = TutorMessage(
        session_id=tutor_session.id or 0,
        student_id=request.student_id,
        course_id=request.course_id,
        role="user",
        content=request.question,
        citations_json="[]",
        source_chunk_ids_json="[]",
        related_resource_ids_json="[]",
        safety_status="grounded",
        verifier_summary="用户问题已保存。",
        confidence_score=1.0,
    )
    session.add(user_message)
    session.commit()
    session.refresh(user_message)

    profile_note = "" if profile is not None else "未找到学习画像，个性化程度较低。"
    citations = _collect_citations(
        course_id=request.course_id,
        question=request.question,
        step=step,
        session=session,
    )
    input_text = (
        f"student_id={request.student_id}; course_id={request.course_id}; "
        f"session_id={tutor_session.id}; question={request.question}"
    )

    try:
        agent_result = TutorAgent().run(
            student=student,
            course=course,
            question=request.question,
            learner_profile=profile,
            step=step,
            resource=resource,
            citations=citations,
            session=session,
            profile_note=profile_note,
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
    citations_payload = parsed["citations"]
    verifier_result = CitationVerifier().verify(
        question=request.question,
        answer=str(parsed["answer"]),
        citations=citations_payload,
    )
    safety_status = str(verifier_result["safety_status"])
    verifier_summary = str(parsed["verifier_summary"])
    if profile_note and profile_note not in verifier_summary:
        verifier_summary = f"{verifier_summary} {profile_note}"
    agent_run = _create_agent_run(
        session,
        student_id=request.student_id,
        course_id=request.course_id,
        input_text=input_text,
        output_text=str(parsed["answer"]),
        status_value="success",
        latency_ms=agent_result.latency_ms,
        llm_log_id=agent_result.llm_log_id,
    )
    assistant_message = TutorMessage(
        session_id=tutor_session.id or 0,
        student_id=request.student_id,
        course_id=request.course_id,
        role="assistant",
        content=str(parsed["answer"]),
        citations_json=_json_dumps(citations_payload),
        source_chunk_ids_json=_json_dumps(parsed["source_chunk_ids"]),
        related_resource_ids_json=_json_dumps(parsed["related_resource_ids"]),
        safety_status=safety_status,
        verifier_summary=verifier_summary,
        confidence_score=float(verifier_result["confidence_score"]),
        agent_run_id=agent_run.id,
        llm_log_id=agent_result.llm_log_id,
    )
    session.add(assistant_message)
    tutor_session.updated_at = utc_now()
    session.add(tutor_session)
    session.commit()
    session.refresh(assistant_message)
    session.refresh(tutor_session)

    return TutorChatResponse(
        session=_read_session(tutor_session),
        user_message=_read_message(user_message),
        assistant_message=_read_message(assistant_message),
        answer=assistant_message.content,
        citations=citations_payload,
        safety_status=assistant_message.safety_status,
        verifier_summary=assistant_message.verifier_summary,
        agent_run_id=agent_run.id,
        llm_log_id=agent_result.llm_log_id,
    )


def list_tutor_sessions(
    session: Session,
    *,
    student_id: int | None = None,
    course_id: int | None = None,
    limit: int = 50,
) -> list[TutorSessionRead]:
    safe_limit = max(1, min(limit, 100))
    statement = select(TutorSession)
    if student_id is not None:
        statement = statement.where(TutorSession.student_id == student_id)
    if course_id is not None:
        statement = statement.where(TutorSession.course_id == course_id)
    sessions = session.exec(
        statement.order_by(col(TutorSession.id).desc()).limit(safe_limit)
    ).all()
    return [_read_session(item) for item in sessions]


def get_tutor_messages(session_id: int, session: Session) -> list[TutorMessageRead]:
    tutor_session = session.get(TutorSession, session_id)
    if tutor_session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tutor session not found")
    messages = session.exec(
        select(TutorMessage)
        .where(TutorMessage.session_id == session_id)
        .order_by(col(TutorMessage.id))
    ).all()
    return [_read_message(message) for message in messages]


def get_tutor_session_detail(session_id: int, session: Session) -> TutorSessionDetailResponse:
    tutor_session = session.get(TutorSession, session_id)
    if tutor_session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tutor session not found")
    return TutorSessionDetailResponse(
        session=_read_session(tutor_session),
        messages=get_tutor_messages(session_id, session),
    )


def get_tutor_quality_check(message_id: int, session: Session) -> TutorQualityCheck:
    message = session.get(TutorMessage, message_id)
    if message is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tutor message not found")
    citations = _json_loads(message.citations_json, [])
    source_chunk_ids = _json_loads(message.source_chunk_ids_json, [])
    issues: list[str] = []
    if message.role == "assistant" and not citations:
        issues.append("回答没有引用来源。")
    if message.safety_status == "unsafe":
        issues.append("问题或回答涉及版权风险或不适合处理的内容。")
    if message.safety_status == "needs_review":
        issues.append("回答需要教师确认。")
    suggestion = (
        "当前回答可作为课程知识库支持的辅导解释。"
        if message.safety_status == "grounded"
        else "建议补充课程资料或请教师确认后再使用。"
    )
    return TutorQualityCheck(
        message_id=message.id or message_id,
        has_citations=bool(citations),
        citation_count=len(citations) if isinstance(citations, list) else 0,
        source_chunk_count=len(source_chunk_ids) if isinstance(source_chunk_ids, list) else 0,
        safety_status=message.safety_status,
        confidence_score=message.confidence_score,
        issues=issues,
        suggestion=suggestion,
    )
