from typing import Any

from sqlmodel import Session, col, select

from app.core.config import get_settings
from app.db.models import (
    Course,
    DocumentChunk,
    GeneratedResource,
    KnowledgePoint,
    LearnerProfile,
    LearningEvaluationReport,
    LearningPath,
    PracticeAttempt,
    PracticeQuiz,
    Student,
    TutorMessage,
    TutorSession,
)
from app.schemas.qa import QACheckItem, QAChecklistResponse, QASmokeItem, QASmokeStatusResponse


def get_qa_checklist() -> QAChecklistResponse:
    items = [
        _item(
            "demo-open",
            "演示工作台",
            "打开 /demo",
            "检查演示工作台是否能展示完整闭环状态。",
            "/demo",
            "页面显示 LLM 模式、基础数据、知识库、画像、路径、资源、辅导、测验和评估状态。",
            "high",
            False,
            False,
            "不会调用模型，适合作为录屏前第一步。",
        ),
        _item(
            "demo-bootstrap",
            "演示工作台",
            "点击 bootstrap",
            "点击“准备基础演示数据”。",
            "/demo",
            "默认学生、数据库系统课程和原创示例知识库就绪；不会生成画像、路径、资源或测验。",
            "high",
            False,
            False,
            "该操作只导入资料并写库，不调用 LLM。",
        ),
        _item(
            "knowledge-import",
            "知识库",
            "导入示例资料",
            "打开 /knowledge-base 并导入《数据库系统》示例资料。",
            "/knowledge-base",
            "文档数和 chunk 数大于 0，重复导入不会大量重复。",
            "high",
            False,
            False,
            "如已在 /demo bootstrap，可只确认状态。",
        ),
        _item(
            "knowledge-search-phantom",
            "知识库",
            "搜索“幻读”",
            "在知识库检索区搜索“幻读”。",
            "/knowledge-base",
            "返回事务与并发控制相关 chunk，并展示来源文件。",
            "high",
            False,
            False,
            "关键词检索不调用模型。",
        ),
        _item(
            "knowledge-search-btree",
            "知识库",
            "搜索“B+树”",
            "在知识库检索区搜索“B+树”。",
            "/knowledge-base",
            "返回索引与 B+ 树相关 chunk。",
            "high",
            False,
            False,
            "关键词检索不调用模型。",
        ),
        _item(
            "knowledge-search-join",
            "知识库",
            "搜索“JOIN”",
            "在知识库检索区搜索“JOIN”。",
            "/knowledge-base",
            "返回 JOIN 与子查询相关 chunk。",
            "high",
            False,
            False,
            "关键词检索不调用模型。",
        ),
        _item(
            "profile-create",
            "学习画像",
            "生成 8 维画像",
            "输入示例学生情况并发送。",
            "/profile",
            "页面展示专业背景、学习目标、知识基础、偏好、认知风格、易错点、时间约束和掌握度。",
            "high",
            True,
            True,
            "Spark 模式下会调用真实模型；Mock 模式适合离线演示。",
        ),
        _item(
            "profile-update",
            "学习画像",
            "二次更新时间约束",
            "追加输入“这周每天只有 1 小时，优先补事务隔离级别”。",
            "/profile",
            "画像版本更新，旧字段不被清空，时间约束或薄弱点发生变化。",
            "medium",
            True,
            True,
            "手动触发的生成操作可能调用 Spark。",
        ),
        _item(
            "path-generate",
            "学习路径",
            "生成 7 天学习路径",
            "基于默认学生和数据库系统课程生成学习路径。",
            "/learning-path",
            "生成 6-8 个步骤，包含目标、知识点、耗时、活动和资源类型。",
            "high",
            True,
            True,
            "生成前应已有学习画像。",
        ),
        _item(
            "path-check",
            "学习路径",
            "检查薄弱点覆盖",
            "查看路径完整性检查。",
            "/learning-path",
            "JOIN、事务、索引、B+树等薄弱点至少部分被路径覆盖。",
            "high",
            False,
            False,
            "读取已生成路径，不调用模型。",
        ),
        _item(
            "resource-note",
            "资源生成",
            "生成 lecture_note",
            "选择一个 learning path step，只生成讲义类型资源。",
            "/resources",
            "生成 Markdown 讲义，并展示 citations。",
            "high",
            True,
            True,
            "Spark 模式下建议先单类型小流量测试。",
        ),
        _item(
            "resource-mindmap",
            "资源生成",
            "生成 mindmap",
            "选择一个 step，生成思维导图资源。",
            "/resources",
            "内容以 Mermaid mindmap 代码块或 Markdown 结构展示。",
            "medium",
            True,
            True,
            "Spark 模式下会调用真实模型。",
        ),
        _item(
            "resource-all",
            "资源生成",
            "一键生成 6 类资源",
            "选择全部资源类型并点击生成。",
            "/resources",
            "至少生成 lecture_note、mindmap、quiz、reading、practice_case、video_script。",
            "medium",
            True,
            True,
            "高消耗操作，Spark 模式下必须确认后再执行。",
        ),
        _item(
            "tutor-question",
            "智能辅导",
            "询问幻读区别",
            "提问“幻读和不可重复读有什么区别？”。",
            "/tutor",
            "回答包含解释、示例、citations、safety_status 和 verifier_summary。",
            "high",
            True,
            True,
            "如知识库已导入，回答应尽量 grounded。",
        ),
        _item(
            "tutor-copyright",
            "智能辅导",
            "检查版权边界",
            "提问“请复制教材原文给我”。",
            "/tutor",
            "系统拒绝复制出版教材原文或给出 unsafe/needs_review 提示。",
            "high",
            True,
            True,
            "不要粘贴真实教材内容。",
        ),
        _item(
            "practice-generate",
            "练习测验",
            "生成测验",
            "选择学习路径 step，生成 4-6 道练习。",
            "/practice",
            "题型包含选择题、简答题或 SQL 实操题，题目前端不暴露标准答案。",
            "high",
            True,
            True,
            "Spark 模式下会调用真实模型生成题目。",
        ),
        _item(
            "practice-submit",
            "练习测验",
            "提交部分正确答案",
            "故意答对一部分、答错一部分并提交。",
            "/practice",
            "展示得分、准确率、每题反馈、错因分析和补救建议。",
            "high",
            True,
            True,
            "自动批改仍通过 Mock/Spark Provider，不执行学生 SQL。",
        ),
        _item(
            "analytics-summary",
            "学习评估",
            "检查学习评估",
            "打开 /analytics 查看统计。",
            "/analytics",
            "显示测验次数、平均准确率、最新掌握度、薄弱点和推荐行动。",
            "high",
            False,
            False,
            "读取报告和画像，不调用模型。",
        ),
        _item(
            "analytics-report",
            "学习评估",
            "检查评估报告",
            "查看最近 LearningEvaluationReport。",
            "/analytics",
            "报告包含 summary、weak_points、strengths、recommended_resources "
            "和 next_plan_suggestion。",
            "medium",
            False,
            False,
            "需要先完成一次测验提交。",
        ),
        _item(
            "llm-provider",
            "LLM 模式",
            "检查当前 provider",
            "打开 /llm-lab 查看当前模型状态。",
            "/llm-lab",
            "显示 mock 或 spark-http；如果是 spark-http，不显示任何 API Key。",
            "high",
            False,
            False,
            "状态查询不调用模型。",
        ),
    ]
    return QAChecklistResponse(
        title="EduForge Phase 12 人工测试清单",
        description=(
            "用于录屏、答辩或提交前逐项检查端到端链路。清单接口只返回测试项，"
            "不会自动调用 LLM，也不会消耗 Spark 额度。"
        ),
        items=items,
    )


def get_qa_smoke_status(session: Session) -> QASmokeStatusResponse:
    student = _default_student(session)
    course = _default_course(session)
    student_id = student.id if student and student.id is not None else None
    course_id = course.id if course and course.id is not None else None

    knowledge_point_count = _count_course(session, KnowledgePoint, course_id) if course_id else 0
    chunk_count = _count_course(session, DocumentChunk, course_id) if course_id else 0
    items = [
        _smoke(
            "students",
            "Student 数据",
            "ok" if _count_all(session, Student) > 0 else "warning",
            "Student 表已有数据。" if _count_all(session, Student) > 0 else "Student 表暂无数据。",
            _count_all(session, Student),
        ),
        _smoke(
            "database_course",
            "《数据库系统》课程",
            "ok" if course_id is not None else "warning",
            "默认课程可用于演示。" if course_id is not None else "未找到默认课程。",
            1 if course_id is not None else 0,
        ),
        _smoke(
            "knowledge_points",
            "KnowledgePoint",
            "ok" if knowledge_point_count >= 10 else "warning",
            "默认课程知识点数量满足演示要求。"
            if knowledge_point_count >= 10
            else "知识点不足 10 个，请检查 seed。",
            knowledge_point_count,
        ),
        _smoke(
            "document_chunks",
            "DocumentChunk",
            "ok" if chunk_count > 0 else "warning",
            "知识库 chunk 已就绪。"
            if chunk_count > 0
            else "知识库 chunk 为空，请在 /demo 或 /knowledge-base 导入资料。",
            chunk_count,
        ),
        _pair_item(
            session,
            LearnerProfile,
            student_id,
            course_id,
            "learner_profiles",
            "LearnerProfile",
        ),
        _pair_item(
            session,
            LearningPath,
            student_id,
            course_id,
            "learning_paths",
            "LearningPath",
        ),
        _pair_item(
            session,
            GeneratedResource,
            student_id,
            course_id,
            "generated_resources",
            "GeneratedResource",
        ),
        _tutor_item(session, student_id, course_id),
        _pair_item(
            session,
            PracticeQuiz,
            student_id,
            course_id,
            "practice_quizzes",
            "PracticeQuiz",
        ),
        _pair_item(
            session,
            PracticeAttempt,
            student_id,
            course_id,
            "practice_attempts",
            "PracticeAttempt",
        ),
        _pair_item(
            session,
            LearningEvaluationReport,
            student_id,
            course_id,
            "evaluation_reports",
            "LearningEvaluationReport",
        ),
        _llm_mode_item(),
    ]
    has_error = any(item.status == "error" for item in items)
    has_warning = any(item.status == "warning" for item in items)
    return QASmokeStatusResponse(
        status="error" if has_error else "warning" if has_warning else "ok",
        items=items,
        warning=(
            "Smoke status 只读取数据库和配置，不调用 LLM 或 Spark。"
            if has_warning
            else None
        ),
    )


def _item(
    id: str,
    module: str,
    title: str,
    description: str,
    route: str,
    expected_result: str,
    priority: str,
    requires_llm: bool,
    may_call_spark: bool,
    status_hint: str,
) -> QACheckItem:
    return QACheckItem(
        id=id,
        module=module,
        title=title,
        description=description,
        route=route,
        expected_result=expected_result,
        priority=priority,
        requires_llm=requires_llm,
        may_call_spark=may_call_spark,
        status_hint=status_hint,
    )


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
        if "数据库" in course.title:
            return course
    return courses[0]


def _count_all(session: Session, model: type[Any]) -> int:
    return len(session.exec(select(model)).all())


def _count_course(session: Session, model: type[Any], course_id: int) -> int:
    return len(session.exec(select(model).where(model.course_id == course_id)).all())


def _count_pair(session: Session, model: type[Any], student_id: int, course_id: int) -> int:
    return len(
        session.exec(
            select(model).where(model.student_id == student_id).where(model.course_id == course_id)
        ).all()
    )


def _smoke(
    key: str,
    title: str,
    status: str,
    message: str,
    count: int | None = None,
) -> QASmokeItem:
    return QASmokeItem(key=key, title=title, status=status, message=message, count=count)


def _pair_item(
    session: Session,
    model: type[Any],
    student_id: int | None,
    course_id: int | None,
    key: str,
    title: str,
) -> QASmokeItem:
    count = _count_pair(session, model, student_id, course_id) if student_id and course_id else 0
    return _smoke(
        key,
        title,
        "ok" if count > 0 else "warning",
        f"{title} 已有演示记录。" if count > 0 else f"{title} 暂无演示记录。",
        count,
    )


def _tutor_item(
    session: Session,
    student_id: int | None,
    course_id: int | None,
) -> QASmokeItem:
    if not student_id or not course_id:
        return _smoke("tutor", "TutorSession / TutorMessage", "warning", "基础数据未就绪。", 0)
    sessions = _count_pair(session, TutorSession, student_id, course_id)
    messages = _count_pair(session, TutorMessage, student_id, course_id)
    return _smoke(
        "tutor",
        "TutorSession / TutorMessage",
        "ok" if messages > 0 else "warning",
        f"已有 {sessions} 个辅导会话，{messages} 条辅导消息。"
        if messages > 0
        else "尚无辅导问答记录。",
        messages,
    )


def _llm_mode_item() -> QASmokeItem:
    settings = get_settings()
    provider = settings.llm_provider
    if settings.use_mock_llm or provider == "mock":
        message = "当前配置为 Mock 模式，Smoke 检查不会调用外部 API。"
        status = "ok"
        count = 1
    elif provider == "spark-http" and settings.spark_http_api_password:
        message = f"当前配置为 spark-http，模型 {settings.spark_model}；Smoke 检查不会调用模型。"
        status = "ok"
        count = 1
    elif provider == "spark-http":
        message = "当前配置为 spark-http，但密钥未配置；运行时会回退 Mock。"
        status = "warning"
        count = 0
    else:
        message = f"当前 LLM Provider 为 {provider}，请确认是否符合演示预期。"
        status = "warning"
        count = 0
    return _smoke("llm_mode", "LLM 模式配置", status, message, count)
