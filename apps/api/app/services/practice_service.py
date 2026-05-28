import json
from typing import Any

from fastapi import HTTPException, status
from sqlmodel import Session, col, select

from app.agents.practice_agent import QUESTION_TYPES, PracticeAgent
from app.db.models import (
    AgentRun,
    Course,
    DocumentChunk,
    GeneratedResource,
    LearnerProfile,
    LearningPath,
    LearningPathStep,
    PracticeQuestion,
    PracticeQuiz,
    Student,
)
from app.schemas.documents import DocumentSearchResult
from app.schemas.practice import (
    GenerateQuizRequest,
    GenerateQuizResponse,
    PracticeQuestionRead,
    PracticeQuizDetailResponse,
    PracticeQuizRead,
    QuestionTypeInfo,
)
from app.services.search_service import search_chunks

QUESTION_TYPE_INFOS = [
    QuestionTypeInfo(
        key="single_choice",
        label="单选题",
        description="用于检查概念辨析和基础判断。",
    ),
    QuestionTypeInfo(
        key="multiple_choice",
        label="多选题",
        description="用于检查多个知识点之间的组合判断。",
    ),
    QuestionTypeInfo(
        key="short_answer",
        label="简答题",
        description="用于检查学生能否用自己的话解释原理和边界。",
    ),
    QuestionTypeInfo(
        key="sql_practice",
        label="SQL 实操题",
        description="用于检查 SQL 结构、连接条件和查询思路，本阶段不执行 SQL。",
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


def _read_quiz(quiz: PracticeQuiz) -> PracticeQuizRead:
    return PracticeQuizRead.model_validate(quiz, from_attributes=True)


def _read_question(question: PracticeQuestion) -> PracticeQuestionRead:
    return PracticeQuestionRead.model_validate(question, from_attributes=True)


def list_question_types() -> list[QuestionTypeInfo]:
    return QUESTION_TYPE_INFOS


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


def _resolve_step(
    session: Session,
    *,
    step_id: int,
    course_id: int,
    path_id: int | None,
) -> LearningPathStep:
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
    if path_id is not None and step.path_id != path_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Step does not belong to the selected learning path",
        )
    return step


def _resolve_path(
    session: Session,
    *,
    path_id: int,
    student_id: int,
    course_id: int,
) -> LearningPath:
    path = session.get(LearningPath, path_id)
    if path is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Learning path not found")
    if path.student_id != student_id or path.course_id != course_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Learning path does not belong to the selected student/course",
        )
    return path


def _query_candidates(step: LearningPathStep, profile: LearnerProfile) -> list[str]:
    candidates = [
        step.title,
        step.objective,
        *[str(item) for item in _json_loads(step.knowledge_points_json, [])],
        *[str(item) for item in _json_loads(profile.weak_points_json, [])],
        "JOIN",
        "事务",
        "幻读",
        "B+树",
        "索引",
        "查询优化",
    ]
    result: list[str] = []
    for candidate in candidates:
        text = str(candidate).strip()
        if text and text not in result:
            result.append(text)
    return result


def _collect_citations(
    session: Session,
    *,
    course_id: int,
    step: LearningPathStep,
    profile: LearnerProfile,
    limit: int = 5,
) -> list[DocumentSearchResult]:
    results: list[DocumentSearchResult] = []
    seen: set[int] = set()
    for query in _query_candidates(step, profile):
        for item in search_chunks(course_id, query, session, limit=3):
            if item.chunk_id not in seen:
                results.append(item)
                seen.add(item.chunk_id)
            if len(results) >= limit:
                return results

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


def _resources_for_step(
    session: Session,
    *,
    step_id: int,
    student_id: int,
) -> list[GeneratedResource]:
    return list(
        session.exec(
            select(GeneratedResource)
            .where(
                GeneratedResource.step_id == step_id,
                GeneratedResource.student_id == student_id,
            )
            .order_by(col(GeneratedResource.id).desc())
            .limit(8)
        ).all()
    )


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
        agent_name="PracticeAgent",
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


def generate_quiz(request: GenerateQuizRequest, session: Session) -> GenerateQuizResponse:
    student = _get_student_or_404(session, request.student_id)
    course = _get_course_or_404(session, request.course_id)
    profile = _resolve_profile(
        session,
        profile_id=request.profile_id,
        student_id=request.student_id,
        course_id=request.course_id,
    )
    step = _resolve_step(
        session,
        step_id=request.step_id,
        course_id=request.course_id,
        path_id=request.path_id,
    )
    path = _resolve_path(
        session,
        path_id=request.path_id or step.path_id,
        student_id=request.student_id,
        course_id=request.course_id,
    )
    selected_types = request.question_types or QUESTION_TYPES
    invalid = [item for item in selected_types if item not in QUESTION_TYPES]
    if invalid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported question_types: {invalid}",
        )
    citations = _collect_citations(session, course_id=request.course_id, step=step, profile=profile)
    resources = _resources_for_step(session, step_id=request.step_id, student_id=request.student_id)
    input_text = (
        f"student_id={request.student_id}; course_id={request.course_id}; "
        f"path_id={path.id}; step_id={request.step_id}; question_count={request.question_count}"
    )
    try:
        agent_result = PracticeAgent().run(
            student=student,
            course=course,
            learner_profile=profile,
            step=step,
            citations=citations,
            resources=resources,
            difficulty=request.difficulty,
            question_count=request.question_count,
            question_types=selected_types,
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
    quiz = PracticeQuiz(
        student_id=request.student_id,
        course_id=request.course_id,
        profile_id=profile.id,
        path_id=path.id,
        step_id=step.id,
        title=str(parsed["title"]),
        description=str(parsed["description"]),
        difficulty=str(parsed["difficulty"]),
        status="ready",
        question_count=len(parsed["questions"]),
        knowledge_points_json=_json_dumps(parsed["knowledge_points"]),
        source_resource_ids_json=_json_dumps(parsed["source_resource_ids"]),
        source_chunk_ids_json=_json_dumps(parsed["source_chunk_ids"]),
    )
    session.add(quiz)
    session.commit()
    session.refresh(quiz)
    if quiz.id is None:
        raise RuntimeError("Failed to create practice quiz.")

    questions: list[PracticeQuestion] = []
    for index, raw_question in enumerate(parsed["questions"], start=1):
        question = PracticeQuestion(
            quiz_id=quiz.id,
            course_id=request.course_id,
            step_id=step.id,
            order_index=index,
            question_type=str(raw_question["question_type"]),
            stem=str(raw_question["stem"]),
            options_json=_json_dumps(raw_question.get("options") or []),
            correct_answer_json=_json_dumps(raw_question.get("correct_answer") or {}),
            explanation=str(raw_question.get("explanation") or ""),
            knowledge_point=str(raw_question.get("knowledge_point") or step.title),
            difficulty=str(raw_question.get("difficulty") or request.difficulty),
            score=int(raw_question.get("score") or 10),
            citations_json=_json_dumps(raw_question.get("citations") or []),
        )
        session.add(question)
        questions.append(question)
    session.commit()
    for question in questions:
        session.refresh(question)

    agent_run = _create_agent_run(
        session,
        student_id=request.student_id,
        course_id=request.course_id,
        input_text=input_text,
        output_text=quiz.title,
        status_value="success",
        latency_ms=agent_result.latency_ms,
        llm_log_id=agent_result.llm_log_id,
    )
    return GenerateQuizResponse(
        quiz=_read_quiz(quiz),
        questions=[_read_question(question) for question in questions],
        agent_run_id=agent_run.id,
        llm_log_id=agent_result.llm_log_id,
        generation_summary=f"已生成 {len(questions)} 道多题型练习，等待学生提交答案。",
    )


def list_quizzes(
    session: Session,
    *,
    student_id: int | None = None,
    course_id: int | None = None,
    step_id: int | None = None,
) -> list[PracticeQuizRead]:
    statement = select(PracticeQuiz)
    if student_id is not None:
        statement = statement.where(PracticeQuiz.student_id == student_id)
    if course_id is not None:
        statement = statement.where(PracticeQuiz.course_id == course_id)
    if step_id is not None:
        statement = statement.where(PracticeQuiz.step_id == step_id)
    quizzes = session.exec(statement.order_by(col(PracticeQuiz.id).desc())).all()
    return [_read_quiz(quiz) for quiz in quizzes]


def get_quiz_detail(quiz_id: int, session: Session) -> PracticeQuizDetailResponse:
    quiz = session.get(PracticeQuiz, quiz_id)
    if quiz is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Practice quiz not found")
    questions = session.exec(
        select(PracticeQuestion)
        .where(PracticeQuestion.quiz_id == quiz_id)
        .order_by(col(PracticeQuestion.order_index))
    ).all()
    return PracticeQuizDetailResponse(
        quiz=_read_quiz(quiz),
        questions=[_read_question(question) for question in questions],
    )
