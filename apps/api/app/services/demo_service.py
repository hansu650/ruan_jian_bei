from sqlmodel import Session, col, select

from app.core.config import get_settings
from app.core.errors import not_found
from app.db.models import (
    Course,
    CourseDocument,
    DocumentChunk,
    GeneratedResource,
    LearnerProfile,
    LearningEvaluationReport,
    LearningPath,
    LearningPathStep,
    PracticeAttempt,
    PracticeQuiz,
    Student,
    TutorMessage,
    TutorSession,
)
from app.db.seed import seed_default_data
from app.schemas.demo import (
    DemoBootstrapResponse,
    DemoStatusResponse,
    DemoStepStatus,
    LLMModeInfo,
)
from app.services.document_indexer import import_sample_documents
from app.services.llm_service import get_provider_status


def _default_student(session: Session) -> Student | None:
    student = session.exec(select(Student).where(Student.email == "demo@example.com")).first()
    if student is not None:
        return student
    return session.exec(select(Student).order_by(col(Student.id))).first()


def _default_course(session: Session) -> Course | None:
    courses = session.exec(select(Course).order_by(col(Course.id))).all()
    if not courses:
        return None
    for course in courses:
        if "数据库" in course.title or "鏁版嵁搴" in course.title:
            return course
    return courses[0]


def _llm_mode(session: Session) -> LLMModeInfo:
    settings = get_settings()
    status = get_provider_status(session)
    if (
        status.provider == "spark-http"
        and status.effective_provider == "mock"
        and not status.spark_http_configured
    ):
        mode_label = "Spark 配置不完整，已回退 Mock"
        mode_level = "warning"
        message = "SPARK_HTTP_API_PASSWORD 未配置，系统已回退 MockLLMProvider。"
    elif status.effective_provider == "spark-http":
        mode_label = "讯飞星火真实模式"
        mode_level = "live"
        message = (
            "当前使用真实讯飞星火 HTTP Provider。手动点击生成类操作会调用真实 API；"
            "演示工作台不会自动批量调用模型。"
        )
    elif status.effective_provider == "mock":
        mode_label = "Mock 模式"
        mode_level = "safe"
        message = "当前使用 MockLLM，不调用外部 API，适合离线演示和自动化测试。"
    else:
        mode_label = status.effective_provider
        mode_level = "warning"
        message = status.warning or "当前 LLM Provider 为预留或未知状态，请按需检查配置。"

    return LLMModeInfo(
        effective_provider=status.effective_provider,
        model=status.model,
        use_mock_llm=status.use_mock_llm,
        spark_http_configured=status.spark_http_configured,
        spark_model=settings.spark_model or None,
        mode_label=mode_label,
        mode_level=mode_level,
        message=message,
    )


def _step(
    *,
    key: str,
    title: str,
    description: str,
    status: str,
    count: int | None,
    action_label: str,
    action_href: str,
    message: str,
) -> DemoStepStatus:
    return DemoStepStatus(
        key=key,
        title=title,
        description=description,
        status=status,
        count=count,
        action_label=action_label,
        action_href=action_href,
        message=message,
    )


def _count_documents(course_id: int, session: Session) -> tuple[int, int]:
    documents = session.exec(
        select(CourseDocument).where(CourseDocument.course_id == course_id)
    ).all()
    chunks = session.exec(select(DocumentChunk).where(DocumentChunk.course_id == course_id)).all()
    return len(documents), len(chunks)


def _count_learning_path(student_id: int, course_id: int, session: Session) -> tuple[int, int]:
    paths = session.exec(
        select(LearningPath)
        .where(LearningPath.student_id == student_id)
        .where(LearningPath.course_id == course_id)
    ).all()
    step_count = 0
    for path in paths:
        if path.id is None:
            continue
        step_count += len(
            session.exec(select(LearningPathStep).where(LearningPathStep.path_id == path.id)).all()
        )
    return len(paths), step_count


def get_demo_status(session: Session) -> DemoStatusResponse:
    student = _default_student(session)
    course = _default_course(session)
    llm_mode = _llm_mode(session)
    steps: list[DemoStepStatus] = []

    basic_ready = student is not None and course is not None
    steps.append(
        _step(
            key="basic_data",
            title="基础数据",
            description="示例学生、数据库系统课程与基础知识点。",
            status="ready" if basic_ready else "missing",
            count=2 if basic_ready else 0,
            action_label="准备基础数据",
            action_href="/demo",
            message="示例学生和数据库系统课程已就绪。"
            if basic_ready
            else "缺少默认学生或课程，请先执行基础演示数据准备。",
        )
    )

    if student is None or course is None or student.id is None or course.id is None:
        for key, title, href in [
            ("knowledge_base", "课程知识库", "/knowledge-base"),
            ("profile", "对话式学习画像", "/profile"),
            ("learning_path", "个性化学习路径", "/learning-path"),
            ("resources", "多类型资源生成", "/resources"),
            ("tutor", "智能辅导", "/tutor"),
            ("practice", "练习测验", "/practice"),
            ("analytics", "学习效果评估", "/analytics"),
        ]:
            steps.append(
                _step(
                    key=key,
                    title=title,
                    description="等待基础数据就绪。",
                    status="missing",
                    count=0,
                    action_label="查看",
                    action_href=href,
                    message="请先准备基础演示数据。",
                )
            )
        return DemoStatusResponse(
            student_id=student.id if student else None,
            course_id=course.id if course else None,
            student_name=student.name if student else None,
            course_title=course.title if course else None,
            llm_mode=llm_mode,
            steps=steps,
            overall_ready=False,
            next_recommended_step="basic_data",
        )

    document_count, chunk_count = _count_documents(course.id, session)
    steps.append(
        _step(
            key="knowledge_base",
            title="课程知识库",
            description="原创 Markdown 课程资料解析、分块与入库。",
            status="ready" if chunk_count > 0 else "missing",
            count=chunk_count,
            action_label="进入知识库",
            action_href="/knowledge-base",
            message=f"已导入 {document_count} 份文档，生成 {chunk_count} 个 chunk。"
            if chunk_count > 0
            else "尚未导入示例课程资料，请准备基础数据或前往知识库页面导入。",
        )
    )

    profile_count = len(
        session.exec(
            select(LearnerProfile)
            .where(LearnerProfile.student_id == student.id)
            .where(LearnerProfile.course_id == course.id)
        ).all()
    )
    steps.append(
        _step(
            key="profile",
            title="对话式学习画像",
            description="ProfileAgent 生成 8 维动态学习画像。",
            status="ready" if profile_count > 0 else "missing",
            count=profile_count,
            action_label="生成学习画像",
            action_href="/profile",
            message="已存在学习画像，可进入下一步生成学习路径。"
            if profile_count > 0
            else "尚未生成学习画像，请前往画像页面手动生成。",
        )
    )

    path_count, step_count = _count_learning_path(student.id, course.id, session)
    steps.append(
        _step(
            key="learning_path",
            title="个性化学习路径",
            description="PlannerAgent 生成阶段化学习步骤和资源类型推荐。",
            status="ready" if step_count >= 5 else "missing",
            count=step_count,
            action_label="生成学习路径",
            action_href="/learning-path",
            message=f"已有 {path_count} 条路径，{step_count} 个学习步骤。"
            if step_count >= 5
            else "尚未形成完整学习路径，请先基于画像生成路径。",
        )
    )

    resource_count = len(
        session.exec(
            select(GeneratedResource)
            .where(GeneratedResource.student_id == student.id)
            .where(GeneratedResource.course_id == course.id)
        ).all()
    )
    resource_status = (
        "ready" if resource_count >= 6 else "warning" if resource_count > 0 else "missing"
    )
    steps.append(
        _step(
            key="resources",
            title="多类型资源生成",
            description="讲义、思维导图、练习题、阅读、实操案例和视频脚本。",
            status=resource_status,
            count=resource_count,
            action_label="生成学习资源",
            action_href="/resources",
            message=f"已有 {resource_count} 个生成资源。"
            if resource_count
            else "尚未生成资源，请选择学习路径步骤后手动生成。",
        )
    )

    tutor_sessions = session.exec(
        select(TutorSession)
        .where(TutorSession.student_id == student.id)
        .where(TutorSession.course_id == course.id)
    ).all()
    tutor_assistant_messages = session.exec(
        select(TutorMessage)
        .where(TutorMessage.student_id == student.id)
        .where(TutorMessage.course_id == course.id)
        .where(TutorMessage.role == "assistant")
    ).all()
    steps.append(
        _step(
            key="tutor",
            title="智能辅导",
            description="TutorAgent 基于课程知识库回答问题并展示引用来源。",
            status="ready" if tutor_assistant_messages else "missing",
            count=len(tutor_assistant_messages),
            action_label="进入智能辅导",
            action_href="/tutor",
            message=(
                f"已有 {len(tutor_sessions)} 个会话，"
                f"{len(tutor_assistant_messages)} 条助手回答。"
            )
            if tutor_assistant_messages
            else "尚未完成辅导问答，请前往智能辅导页面提问。",
        )
    )

    quizzes = session.exec(
        select(PracticeQuiz)
        .where(PracticeQuiz.student_id == student.id)
        .where(PracticeQuiz.course_id == course.id)
    ).all()
    attempts = session.exec(
        select(PracticeAttempt)
        .where(PracticeAttempt.student_id == student.id)
        .where(PracticeAttempt.course_id == course.id)
    ).all()
    practice_status = "ready" if attempts else "warning" if quizzes else "missing"
    steps.append(
        _step(
            key="practice",
            title="练习测验",
            description="PracticeAgent 生成测验，EvaluatorAgent 自动批改。",
            status=practice_status,
            count=len(attempts) if attempts else len(quizzes),
            action_label="进入练习测验",
            action_href="/practice",
            message=f"已有 {len(quizzes)} 份测验，{len(attempts)} 次提交。"
            if quizzes or attempts
            else "尚未生成并提交测验，请前往练习测验页面手动操作。",
        )
    )

    reports = session.exec(
        select(LearningEvaluationReport)
        .where(LearningEvaluationReport.student_id == student.id)
        .where(LearningEvaluationReport.course_id == course.id)
    ).all()
    steps.append(
        _step(
            key="analytics",
            title="学习效果评估",
            description="展示测验结果、掌握度变化、薄弱点和补救建议。",
            status="ready" if reports else "missing",
            count=len(reports),
            action_label="查看学习评估",
            action_href="/analytics",
            message=f"已有 {len(reports)} 份学习效果评估报告。"
            if reports
            else "尚未生成评估报告，请先完成一次测验提交。",
        )
    )

    next_step = next((step.key for step in steps if step.status == "missing"), None)
    return DemoStatusResponse(
        student_id=student.id,
        course_id=course.id,
        student_name=student.name,
        course_title=course.title,
        llm_mode=llm_mode,
        steps=steps,
        overall_ready=next_step is None,
        next_recommended_step=next_step,
    )


def bootstrap_demo_data(session: Session) -> DemoBootstrapResponse:
    seed_default_data(session)
    student = _default_student(session)
    course = _default_course(session)
    if student is None or student.id is None:
        raise not_found("默认示例学生不存在，无法准备演示数据。")
    if course is None or course.id is None:
        raise not_found("默认数据库系统课程不存在，无法准备演示数据。")

    result = import_sample_documents(course.id, session)
    _, chunk_count = _count_documents(course.id, session)
    return DemoBootstrapResponse(
        student_id=student.id,
        course_id=course.id,
        imported_documents=result.imported_documents,
        chunk_count=chunk_count,
        message=(
            "基础演示数据已准备：默认学生、数据库系统课程、知识点和原创示例资料已就绪。"
            "本操作不会生成画像、路径、资源、测验，也不会调用 LLM。"
        ),
    )
