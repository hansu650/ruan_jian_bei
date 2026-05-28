import json
from typing import Any

from fastapi import HTTPException, status
from sqlmodel import Session, col, select

from app.agents.evaluator_agent import EvaluatorAgent
from app.db.models import (
    AgentRun,
    Course,
    LearnerProfile,
    LearningEvaluationReport,
    PracticeAnswer,
    PracticeAttempt,
    PracticeQuestion,
    PracticeQuiz,
    Student,
    utc_now,
)
from app.schemas.evaluation import LearningAnalyticsSummary, LearningEvaluationReportRead
from app.schemas.practice import (
    PracticeAnswerRead,
    PracticeAttemptDetailResponse,
    PracticeAttemptRead,
    PracticeQuestionWithAnswerRead,
    PracticeQuizRead,
    SubmitQuizRequest,
    SubmitQuizResponse,
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


def _read_quiz(quiz: PracticeQuiz) -> PracticeQuizRead:
    return PracticeQuizRead.model_validate(quiz, from_attributes=True)


def _read_question_with_answer(question: PracticeQuestion) -> PracticeQuestionWithAnswerRead:
    return PracticeQuestionWithAnswerRead.model_validate(question, from_attributes=True)


def _read_attempt(attempt: PracticeAttempt) -> PracticeAttemptRead:
    return PracticeAttemptRead.model_validate(attempt, from_attributes=True)


def _read_answer(answer: PracticeAnswer) -> PracticeAnswerRead:
    return PracticeAnswerRead.model_validate(answer, from_attributes=True)


def _read_report(report: LearningEvaluationReport) -> LearningEvaluationReportRead:
    return LearningEvaluationReportRead.model_validate(report, from_attributes=True)


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
        agent_name="EvaluatorAgent",
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


def _quiz_questions(session: Session, quiz_id: int) -> list[PracticeQuestion]:
    return list(
        session.exec(
            select(PracticeQuestion)
            .where(PracticeQuestion.quiz_id == quiz_id)
            .order_by(col(PracticeQuestion.order_index))
        ).all()
    )


def _profile_for_quiz(session: Session, quiz: PracticeQuiz) -> LearnerProfile | None:
    if quiz.profile_id is not None:
        profile = session.get(LearnerProfile, quiz.profile_id)
        if profile is not None:
            return profile
    return session.exec(
        select(LearnerProfile)
        .where(
            LearnerProfile.student_id == quiz.student_id,
            LearnerProfile.course_id == quiz.course_id,
        )
        .order_by(col(LearnerProfile.id).desc())
    ).first()


def submit_quiz(request: SubmitQuizRequest, session: Session) -> SubmitQuizResponse:
    quiz = session.get(PracticeQuiz, request.quiz_id)
    if quiz is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Practice quiz not found")
    _get_student_or_404(session, request.student_id)
    if quiz.student_id != request.student_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quiz does not belong to the selected student",
        )
    if not request.answers:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one answer is required",
        )
    questions = _quiz_questions(session, quiz.id or request.quiz_id)
    question_ids = {question.id for question in questions}
    for item in request.answers:
        if item.question_id not in question_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Submitted answer contains question outside this quiz",
            )
    profile = _profile_for_quiz(session, quiz)
    input_text = (
        f"quiz_id={quiz.id}; student_id={request.student_id}; "
        f"answers={len(request.answers)}"
    )
    try:
        agent_result = EvaluatorAgent().run(
            quiz=quiz,
            questions=questions,
            submitted_answers=request.answers,
            learner_profile=profile,
            session=session,
        )
    except Exception as exc:
        _create_agent_run(
            session,
            student_id=request.student_id,
            course_id=quiz.course_id,
            input_text=input_text,
            output_text=None,
            status_value="failed",
            latency_ms=None,
            llm_log_id=None,
            error_message=str(exc),
        )
        raise

    parsed = agent_result.parsed
    agent_run = _create_agent_run(
        session,
        student_id=request.student_id,
        course_id=quiz.course_id,
        input_text=input_text,
        output_text=str(parsed.get("feedback_summary") or ""),
        status_value="success",
        latency_ms=agent_result.latency_ms,
        llm_log_id=agent_result.llm_log_id,
    )
    attempt_summary = parsed["attempt_summary"]
    attempt = PracticeAttempt(
        quiz_id=quiz.id or request.quiz_id,
        student_id=request.student_id,
        course_id=quiz.course_id,
        profile_id=profile.id if profile else None,
        status="graded",
        total_score=int(attempt_summary["total_score"]),
        max_score=int(attempt_summary["max_score"]),
        accuracy=float(attempt_summary["accuracy"]),
        weak_points_json=_json_dumps(parsed["weak_points"]),
        mastery_before_json=_json_dumps(parsed["mastery_before"]),
        mastery_after_json=_json_dumps(parsed["mastery_after"]),
        feedback_summary=str(parsed["feedback_summary"]),
        recommended_actions_json=_json_dumps(parsed["recommended_actions"]),
        agent_run_id=agent_run.id,
        llm_log_id=agent_result.llm_log_id,
        graded_at=utc_now(),
    )
    session.add(attempt)
    session.commit()
    session.refresh(attempt)
    if attempt.id is None:
        raise RuntimeError("Failed to create practice attempt.")

    answer_rows: list[PracticeAnswer] = []
    for raw_answer in parsed["answers"]:
        answer_row = PracticeAnswer(
            attempt_id=attempt.id,
            question_id=int(raw_answer["question_id"]),
            answer_json=_json_dumps(raw_answer["answer"]),
            is_correct=bool(raw_answer["is_correct"]),
            score_awarded=int(raw_answer["score_awarded"]),
            max_score=int(raw_answer["max_score"]),
            feedback=str(raw_answer["feedback"]),
            mistake_reason=str(raw_answer["mistake_reason"]),
            related_knowledge_point=str(raw_answer["related_knowledge_point"]),
        )
        session.add(answer_row)
        answer_rows.append(answer_row)

    if profile is not None:
        profile.mastery_json = _json_dumps(parsed["mastery_after"])
        profile.version += 1
        profile.updated_at = utc_now()

    report_payload = parsed["evaluation_report"]
    report = LearningEvaluationReport(
        student_id=request.student_id,
        course_id=quiz.course_id,
        profile_id=profile.id if profile else None,
        attempt_id=attempt.id,
        title=str(report_payload["title"]),
        overall_score=float(report_payload["overall_score"]),
        summary=str(report_payload["summary"]),
        weak_points_json=_json_dumps(report_payload["weak_points"]),
        strengths_json=_json_dumps(report_payload["strengths"]),
        mastery_delta_json=_json_dumps(report_payload["mastery_delta"]),
        recommended_resources_json=_json_dumps(report_payload["recommended_resources"]),
        next_plan_suggestion=str(report_payload["next_plan_suggestion"]),
    )
    session.add(report)
    session.commit()
    for answer_row in answer_rows:
        session.refresh(answer_row)
    session.refresh(report)
    if profile is not None:
        session.refresh(profile)

    return SubmitQuizResponse(
        attempt=_read_attempt(attempt),
        answers=[_read_answer(answer) for answer in answer_rows],
        evaluation_report_id=report.id,
        updated_profile_id=profile.id if profile else None,
    )


def list_attempts(
    session: Session,
    *,
    student_id: int | None = None,
    course_id: int | None = None,
    quiz_id: int | None = None,
) -> list[PracticeAttemptRead]:
    statement = select(PracticeAttempt)
    if student_id is not None:
        statement = statement.where(PracticeAttempt.student_id == student_id)
    if course_id is not None:
        statement = statement.where(PracticeAttempt.course_id == course_id)
    if quiz_id is not None:
        statement = statement.where(PracticeAttempt.quiz_id == quiz_id)
    attempts = session.exec(statement.order_by(col(PracticeAttempt.id).desc())).all()
    return [_read_attempt(attempt) for attempt in attempts]


def get_attempt_detail(attempt_id: int, session: Session) -> PracticeAttemptDetailResponse:
    attempt = session.get(PracticeAttempt, attempt_id)
    if attempt is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Practice attempt not found",
        )
    quiz = session.get(PracticeQuiz, attempt.quiz_id)
    if quiz is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Practice quiz not found")
    questions = _quiz_questions(session, quiz.id or attempt.quiz_id)
    answers = session.exec(
        select(PracticeAnswer)
        .where(PracticeAnswer.attempt_id == attempt_id)
        .order_by(col(PracticeAnswer.id))
    ).all()
    return PracticeAttemptDetailResponse(
        attempt=_read_attempt(attempt),
        quiz=_read_quiz(quiz),
        questions=[_read_question_with_answer(question) for question in questions],
        answers=[_read_answer(answer) for answer in answers],
    )


def list_evaluation_reports(
    session: Session,
    *,
    student_id: int | None = None,
    course_id: int | None = None,
) -> list[LearningEvaluationReportRead]:
    statement = select(LearningEvaluationReport)
    if student_id is not None:
        statement = statement.where(LearningEvaluationReport.student_id == student_id)
    if course_id is not None:
        statement = statement.where(LearningEvaluationReport.course_id == course_id)
    reports = session.exec(statement.order_by(col(LearningEvaluationReport.id).desc())).all()
    return [_read_report(report) for report in reports]


def get_evaluation_report(report_id: int, session: Session) -> LearningEvaluationReportRead:
    report = session.get(LearningEvaluationReport, report_id)
    if report is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Learning evaluation report not found",
        )
    return _read_report(report)


def get_learning_analytics_summary(
    student_id: int,
    course_id: int,
    session: Session,
) -> LearningAnalyticsSummary:
    _get_student_or_404(session, student_id)
    _get_course_or_404(session, course_id)
    profile = session.exec(
        select(LearnerProfile)
        .where(
            LearnerProfile.student_id == student_id,
            LearnerProfile.course_id == course_id,
        )
        .order_by(col(LearnerProfile.id).desc())
    ).first()
    quiz_count = len(
        session.exec(
            select(PracticeQuiz).where(
                PracticeQuiz.student_id == student_id,
                PracticeQuiz.course_id == course_id,
            )
        ).all()
    )
    attempts = session.exec(
        select(PracticeAttempt)
        .where(
            PracticeAttempt.student_id == student_id,
            PracticeAttempt.course_id == course_id,
        )
        .order_by(col(PracticeAttempt.id).desc())
    ).all()
    average_accuracy = (
        sum(attempt.accuracy for attempt in attempts) / len(attempts) if attempts else 0.0
    )
    latest_report_model = session.exec(
        select(LearningEvaluationReport)
        .where(
            LearningEvaluationReport.student_id == student_id,
            LearningEvaluationReport.course_id == course_id,
        )
        .order_by(col(LearningEvaluationReport.id).desc())
    ).first()
    latest_report = _read_report(latest_report_model) if latest_report_model else None
    latest_attempt = attempts[0] if attempts else None
    return LearningAnalyticsSummary(
        student_id=student_id,
        course_id=course_id,
        profile_id=profile.id if profile else None,
        latest_mastery_json=profile.mastery_json if profile else "{}",
        quiz_count=quiz_count,
        attempt_count=len(attempts),
        average_accuracy=round(average_accuracy, 4),
        latest_weak_points=(
            _json_loads(latest_attempt.weak_points_json, []) if latest_attempt else []
        ),
        latest_recommended_actions=_json_loads(latest_attempt.recommended_actions_json, [])
        if latest_attempt
        else [],
        latest_report=latest_report,
    )
