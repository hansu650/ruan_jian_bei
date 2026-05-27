from sqlmodel import Session, select

from app.db.models import Course, KnowledgePoint, ProfileDraft, ResourceItem, Student


def seed_default_data(session: Session) -> None:
    student = session.exec(select(Student).where(Student.name == "示例学生")).first()
    if student is None:
        student = Student(
            name="示例学生",
            major="计算机科学与技术",
            grade_level="大二",
            email="demo@example.com",
        )
        session.add(student)
        session.commit()
        session.refresh(student)

    course = session.exec(select(Course).where(Course.title == "数据库系统")).first()
    if course is None:
        course = Course(
            title="数据库系统",
            description="面向计算机专业本科生的数据库系统课程，覆盖关系模型、SQL、范式、事务、索引和查询优化。",
            subject="计算机科学",
            semester="2026 春季",
        )
        session.add(course)
        session.commit()
        session.refresh(course)

    if course.id is None or student.id is None:
        raise RuntimeError("Seed data failed to create default student or course.")

    knowledge_points = [
        (
            "数据库基础",
            "第 1 章",
            1,
            "理解数据库系统的基本概念、数据模型和数据库管理系统作用。",
            "easy",
        ),
        ("关系模型", "第 2 章", 2, "掌握关系、元组、属性、键和关系完整性约束。", "medium"),
        (
            "SQL 基础",
            "第 3 章",
            3,
            "掌握 SELECT、WHERE、GROUP BY、ORDER BY 等 SQL 基础语法。",
            "easy",
        ),
        ("JOIN 与子查询", "第 4 章", 4, "理解多表连接、嵌套查询和常见 SQL 查询模式。", "medium"),
        ("ER 建模", "第 5 章", 5, "掌握实体、联系、属性和 ER 图到关系模式的转换。", "medium"),
        (
            "函数依赖与范式",
            "第 6 章",
            6,
            "理解函数依赖、候选键、第三范式和 BCNF 的基本判断。",
            "hard",
        ),
        ("事务与并发控制", "第 7 章", 7, "理解事务 ACID、并发异常、隔离级别和锁机制。", "hard"),
        ("索引与 B+ 树", "第 8 章", 8, "理解索引结构、B+ 树查找过程和索引适用场景。", "hard"),
        ("查询优化", "第 9 章", 9, "了解查询执行计划、选择率估计和常见优化策略。", "hard"),
        ("综合复习", "第 10 章", 10, "串联 SQL、范式、事务、索引和查询优化等考试重点。", "medium"),
    ]
    for title, chapter, order_index, summary, difficulty in knowledge_points:
        exists = session.exec(
            select(KnowledgePoint).where(
                KnowledgePoint.course_id == course.id,
                KnowledgePoint.title == title,
            )
        ).first()
        if exists is None:
            session.add(
                KnowledgePoint(
                    course_id=course.id,
                    title=title,
                    chapter=chapter,
                    order_index=order_index,
                    summary=summary,
                    difficulty=difficulty,
                )
            )
    session.commit()

    profile_draft = session.exec(
        select(ProfileDraft).where(
            ProfileDraft.student_id == student.id,
            ProfileDraft.course_id == course.id,
            ProfileDraft.goal == "7 天掌握数据库系统期末重点",
        )
    ).first()
    if profile_draft is None:
        session.add(
            ProfileDraft(
                student_id=student.id,
                course_id=course.id,
                goal="7 天掌握数据库系统期末重点",
                background="SQL 基础中等，事务和索引薄弱",
                weak_points_json='["JOIN", "事务隔离级别", "B+树索引", "查询优化"]',
                preferences_json='["例题", "图解", "实操案例"]',
                mastery_json='{"SQL基础":70,"JOIN":45,"事务":35,"索引":30}',
                notes="第三阶段演示用画像草稿，后续由 ProfileAgent 动态生成。",
            )
        )
        session.commit()

    resources = [
        ("事务与并发控制讲义", "lecture_note", "事务 ACID、并发异常和隔离级别的讲义占位。"),
        ("B+ 树思维导图", "mindmap", "B+ 树结构、查找路径和索引应用的思维导图占位。"),
        ("SQL JOIN 练习题", "quiz", "围绕内连接、外连接和子查询的练习题占位。"),
        ("查询优化实操案例", "practice_case", "基于执行计划和索引选择的实操案例占位。"),
        (
            "事务隔离级别视频脚本",
            "video_script",
            "解释读未提交、读已提交、可重复读和串行化的视频脚本占位。",
        ),
    ]
    for title, resource_type, content_preview in resources:
        existing_resource = session.exec(
            select(ResourceItem).where(
                ResourceItem.course_id == course.id,
                ResourceItem.title == title,
            )
        ).first()
        if existing_resource is None:
            session.add(
                ResourceItem(
                    course_id=course.id,
                    student_id=student.id,
                    resource_type=resource_type,
                    title=title,
                    status="planned",
                    content_preview=content_preview,
                )
            )
    session.commit()
