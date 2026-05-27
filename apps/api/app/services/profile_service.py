import json
from typing import Any

from fastapi import HTTPException, status
from sqlmodel import Session, col, select

from app.agents.profile_agent import ProfileAgent
from app.db.models import (
    AgentRun,
    Course,
    LearnerProfile,
    ProfileChatMessage,
    ProfileDraft,
    Student,
    utc_now,
)
from app.schemas.agent_runs import AgentRunRead
from app.schemas.profiles import (
    LearnerProfileRead,
    ProfileChatMessageRead,
    ProfileChatRequest,
    ProfileChatResponse,
    ProfileDimensionCheck,
    ProfileSummaryResponse,
)

REQUIRED_DIMENSIONS = [
    "专业背景",
    "学习目标",
    "知识基础",
    "学习偏好",
    "认知风格",
    "易错点",
    "时间约束",
    "知识点掌握度",
]


def _preview(text: str, limit: int = 500) -> str:
    return " ".join(text.split())[:limit]


def _json_dumps(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"))


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


def _read_profile(profile: LearnerProfile) -> LearnerProfileRead:
    return LearnerProfileRead.model_validate(profile, from_attributes=True)


def _read_message(message: ProfileChatMessage) -> ProfileChatMessageRead:
    return ProfileChatMessageRead.model_validate(message, from_attributes=True)


def _read_agent_run(agent_run: AgentRun) -> AgentRunRead:
    return AgentRunRead.model_validate(agent_run, from_attributes=True)


def _find_profile(
    session: Session,
    *,
    student_id: int,
    course_id: int,
) -> LearnerProfile | None:
    return session.exec(
        select(LearnerProfile).where(
            LearnerProfile.student_id == student_id,
            LearnerProfile.course_id == course_id,
        )
    ).first()


def get_or_create_profile(
    session: Session,
    *,
    student_id: int,
    course_id: int,
) -> tuple[LearnerProfile, bool]:
    _get_student_or_404(session, student_id)
    _get_course_or_404(session, course_id)
    profile = _find_profile(session, student_id=student_id, course_id=course_id)
    if profile is not None:
        return profile, False
    profile = LearnerProfile(student_id=student_id, course_id=course_id)
    session.add(profile)
    session.commit()
    session.refresh(profile)
    return profile, True


def _find_profile_draft(
    session: Session,
    *,
    student_id: int,
    course_id: int,
) -> ProfileDraft | None:
    return session.exec(
        select(ProfileDraft).where(
            ProfileDraft.student_id == student_id,
            ProfileDraft.course_id == course_id,
        )
    ).first()


def _recent_messages(
    session: Session,
    *,
    student_id: int,
    course_id: int,
    limit: int = 12,
) -> list[ProfileChatMessage]:
    messages = session.exec(
        select(ProfileChatMessage)
        .where(
            ProfileChatMessage.student_id == student_id,
            ProfileChatMessage.course_id == course_id,
        )
        .order_by(col(ProfileChatMessage.id).desc())
        .limit(limit)
    ).all()
    return list(reversed(messages))


def _apply_profile_updates(
    profile: LearnerProfile,
    updates: dict[str, Any],
    *,
    is_created: bool,
) -> None:
    profile.major = str(updates.get("major") or profile.major)
    profile.learning_goal = str(updates.get("learning_goal") or profile.learning_goal)
    profile.knowledge_base = str(updates.get("knowledge_base") or profile.knowledge_base)
    profile.learning_preference_json = _json_dumps(updates.get("learning_preference") or [])
    profile.cognitive_style = str(updates.get("cognitive_style") or profile.cognitive_style)
    profile.weak_points_json = _json_dumps(updates.get("weak_points") or [])
    profile.time_constraint = str(updates.get("time_constraint") or profile.time_constraint)
    profile.mastery_json = _json_dumps(updates.get("mastery") or {})
    profile.profile_summary = str(updates.get("profile_summary") or profile.profile_summary)
    if not is_created:
        profile.version += 1
    profile.updated_at = utc_now()


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
        agent_name="ProfileAgent",
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


def list_learner_profiles(
    session: Session,
    *,
    student_id: int | None = None,
    course_id: int | None = None,
) -> list[LearnerProfileRead]:
    statement = select(LearnerProfile)
    if student_id is not None:
        statement = statement.where(LearnerProfile.student_id == student_id)
    if course_id is not None:
        statement = statement.where(LearnerProfile.course_id == course_id)
    profiles = session.exec(statement.order_by(col(LearnerProfile.id).desc())).all()
    return [_read_profile(profile) for profile in profiles]


def get_learner_profile(session: Session, profile_id: int) -> LearnerProfileRead:
    profile = session.get(LearnerProfile, profile_id)
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Learner profile not found",
        )
    return _read_profile(profile)


def chat_with_profile_agent(
    request: ProfileChatRequest,
    session: Session,
) -> ProfileChatResponse:
    student = _get_student_or_404(session, request.student_id)
    course = _get_course_or_404(session, request.course_id)
    profile = _find_profile(
        session,
        student_id=request.student_id,
        course_id=request.course_id,
    )
    profile_draft = _find_profile_draft(
        session,
        student_id=request.student_id,
        course_id=request.course_id,
    )
    user_message = ProfileChatMessage(
        student_id=request.student_id,
        course_id=request.course_id,
        profile_id=profile.id if profile else None,
        role="user",
        content=request.message,
    )
    session.add(user_message)
    session.commit()
    session.refresh(user_message)

    try:
        agent_result = ProfileAgent().run(
            student=student,
            course=course,
            message=request.message,
            session=session,
            existing_profile=profile,
            profile_draft=profile_draft,
            recent_messages=_recent_messages(
                session,
                student_id=request.student_id,
                course_id=request.course_id,
            ),
        )
    except Exception as exc:
        _create_agent_run(
            session,
            student_id=request.student_id,
            course_id=request.course_id,
            input_text=request.message,
            output_text=None,
            status_value="failed",
            latency_ms=None,
            llm_log_id=None,
            error_message=str(exc),
        )
        raise

    is_created = profile is None
    if profile is None:
        profile = LearnerProfile(
            student_id=request.student_id,
            course_id=request.course_id,
        )
        session.add(profile)
        session.commit()
        session.refresh(profile)

    _apply_profile_updates(profile, agent_result.parsed, is_created=is_created)
    session.add(profile)
    session.commit()
    session.refresh(profile)

    user_message.profile_id = profile.id
    assistant_message = ProfileChatMessage(
        student_id=request.student_id,
        course_id=request.course_id,
        profile_id=profile.id,
        role="assistant",
        content=agent_result.content,
    )
    session.add(user_message)
    session.add(assistant_message)
    session.commit()

    agent_run = _create_agent_run(
        session,
        student_id=request.student_id,
        course_id=request.course_id,
        input_text=request.message,
        output_text=agent_result.content,
        status_value="success",
        latency_ms=agent_result.latency_ms,
        llm_log_id=agent_result.llm_log_id,
    )
    return ProfileChatResponse(
        profile=_read_profile(profile),
        assistant_message=agent_result.content,
        extracted_updates=agent_result.parsed,
        is_created=is_created,
        agent_run_id=agent_run.id,
        llm_log_id=agent_result.llm_log_id,
    )


def get_profile_summary(
    session: Session,
    *,
    student_id: int,
    course_id: int,
) -> ProfileSummaryResponse:
    _get_student_or_404(session, student_id)
    _get_course_or_404(session, course_id)
    profile = _find_profile(session, student_id=student_id, course_id=course_id)
    messages = _recent_messages(session, student_id=student_id, course_id=course_id, limit=50)
    return ProfileSummaryResponse(
        profile=_read_profile(profile) if profile else None,
        messages=[_read_message(message) for message in messages],
    )


def get_dimension_check(
    session: Session,
    *,
    student_id: int,
    course_id: int,
) -> ProfileDimensionCheck:
    _get_student_or_404(session, student_id)
    _get_course_or_404(session, course_id)
    profile = _find_profile(session, student_id=student_id, course_id=course_id)
    if profile is None:
        return ProfileDimensionCheck(
            required_dimensions=REQUIRED_DIMENSIONS,
            completed_dimensions=[],
            missing_dimensions=REQUIRED_DIMENSIONS,
            completion_rate=0.0,
        )
    checks = {
        "专业背景": bool(profile.major.strip()),
        "学习目标": bool(profile.learning_goal.strip()),
        "知识基础": bool(profile.knowledge_base.strip()),
        "学习偏好": bool(json.loads(profile.learning_preference_json or "[]")),
        "认知风格": bool(profile.cognitive_style.strip()),
        "易错点": bool(json.loads(profile.weak_points_json or "[]")),
        "时间约束": bool(profile.time_constraint.strip()),
        "知识点掌握度": bool(json.loads(profile.mastery_json or "{}")),
    }
    completed = [name for name, done in checks.items() if done]
    missing = [name for name in REQUIRED_DIMENSIONS if name not in completed]
    return ProfileDimensionCheck(
        required_dimensions=REQUIRED_DIMENSIONS,
        completed_dimensions=completed,
        missing_dimensions=missing,
        completion_rate=round(len(completed) / len(REQUIRED_DIMENSIONS), 2),
    )


def list_agent_runs(
    session: Session,
    *,
    agent_name: str | None = None,
    student_id: int | None = None,
    course_id: int | None = None,
    limit: int = 50,
) -> list[AgentRunRead]:
    safe_limit = max(1, min(limit, 100))
    statement = select(AgentRun)
    if agent_name:
        statement = statement.where(AgentRun.agent_name == agent_name)
    if student_id is not None:
        statement = statement.where(AgentRun.student_id == student_id)
    if course_id is not None:
        statement = statement.where(AgentRun.course_id == course_id)
    runs = session.exec(statement.order_by(col(AgentRun.id).desc()).limit(safe_limit)).all()
    return [_read_agent_run(run) for run in runs]
