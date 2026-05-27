# EduForge API

FastAPI 后端服务，当前处于第六阶段：对话式学习画像 ProfileAgent。

## 技术栈

- Python 3.11
- FastAPI
- Pydantic v2
- SQLModel
- SQLite
- pytest / ruff / mypy

第六阶段不新增大模型 SDK，不引入 LangChain、OpenAI SDK、ChromaDB、sentence-transformers、torch、Redis 或 Celery。

## 启动

```bash
conda activate cnsoftbei_a3_eduforge
cd apps/api
pip install -r requirements.txt
pip install -r requirements-dev.txt
pip install -e .
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## ProfileAgent API

- `GET /api/learner-profiles`
- `GET /api/learner-profiles/{profile_id}`
- `POST /api/learner-profiles/chat`
- `GET /api/learner-profiles/summary/by-student-course`
- `GET /api/learner-profiles/dimension-check/by-student-course`
- `GET /api/agent-runs`

## 数据模型

- `LearnerProfile`：保存 8 维动态学习画像。
- `ProfileChatMessage`：保存画像构建过程中的用户和助手消息。
- `AgentRun`：保存 ProfileAgent 运行记录，含输入预览、输出预览、状态、延迟和 llm_log_id。

## 阶段边界

本阶段只实现 ProfileAgent，不实现 PlannerAgent、ResourceAgent、TutorAgent、测验批改、完整多智能体编排、RAG 或真实外部模型调用。

## 测试

```bash
pytest
ruff check .
mypy app tests
```
