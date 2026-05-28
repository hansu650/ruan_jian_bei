# EduForge API

FastAPI 后端服务，当前处于第七阶段：个性化学习路径 PlannerAgent。

## 技术栈

- Python 3.11
- FastAPI
- Pydantic v2
- SQLModel
- SQLite
- pytest / ruff / mypy

第七阶段不新增大模型 SDK，不引入 LangChain、OpenAI SDK、ChromaDB、sentence-transformers、torch、Redis 或 Celery。

## 启动

```bash
conda activate cnsoftbei_a3_eduforge
cd apps/api
pip install -r requirements.txt
pip install -r requirements-dev.txt
pip install -e .
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## 主要 API

学习画像：

- `GET /api/learner-profiles`
- `POST /api/learner-profiles/chat`
- `GET /api/learner-profiles/summary/by-student-course`
- `GET /api/learner-profiles/dimension-check/by-student-course`

学习路径：

- `POST /api/learning-paths/generate`
- `GET /api/learning-paths`
- `GET /api/learning-paths/{path_id}`
- `GET /api/learning-paths/{path_id}/steps`
- `GET /api/learning-paths/{path_id}/plan-check`

运行记录：

- `GET /api/agent-runs`

## 数据模型

- `LearnerProfile`：保存 8 维动态学习画像。
- `ProfileChatMessage`：保存画像构建过程中的用户和助手消息。
- `AgentRun`：保存 ProfileAgent、PlannerAgent 等智能体运行记录。
- `LearningPath`：保存一次学习路径规划结果。
- `LearningPathStep`：保存路径中的阶段化学习步骤。

## PlannerAgent

PlannerAgent 会读取学生、课程、学习画像、课程知识点和少量文档 chunk 摘要，调用 MockLLM 的 `learning_path` 场景，并在 JSON 解析失败时使用 fallback 规划算法。生成结果会覆盖画像中的薄弱点，例如 JOIN、事务隔离级别、B+ 树索引和查询优化。

本阶段只推荐资源类型，例如讲义、思维导图、练习题、拓展阅读、实操案例和视频脚本，不生成具体资源内容。

## 测试

```bash
pytest
ruff check .
mypy app tests
```

## 阶段边界

本阶段没有实现 ResourceAgent、TutorAgent、测验批改、完整多智能体编排、真实 RAG、embedding 或真实外部模型调用。
