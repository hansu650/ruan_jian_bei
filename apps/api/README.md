# EduForge API

FastAPI 后端服务，当前处于第五阶段：MockLLM 与讯飞接口预留。

## 技术栈

- Python 3.11
- FastAPI
- Pydantic v2
- SQLModel
- SQLite
- pytest / ruff / mypy

第五阶段不新增大模型 SDK，不引入 LangChain、OpenAI SDK、ChromaDB、sentence-transformers、torch、Celery 或 Redis。

## 安装

```bash
conda activate cnsoftbei_a3_eduforge
cd apps/api
pip install -r requirements.txt
pip install -r requirements-dev.txt
pip install -e .
```

## 启动

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## LLM API

- `GET /api/llm/status`
- `GET /api/llm/scenarios`
- `POST /api/llm/generate`
- `POST /api/llm/chat`
- `GET /api/llm/logs`

默认使用 MockLLMProvider，无 API Key 也能演示。SparkProvider 只是预留接口，不发起网络请求。

## 其他 API

基础：

- `GET /api/health`
- `GET /api/meta`

数据底座：

- `GET /api/students`
- `GET /api/courses`
- `GET /api/profile-drafts`
- `GET /api/resource-items`

知识库基础：

- `GET /api/courses/{course_id}/documents`
- `POST /api/courses/{course_id}/documents/import-sample`
- `POST /api/courses/{course_id}/documents/upload`
- `GET /api/courses/{course_id}/knowledge-base/search?q=幻读`

## 第五阶段边界

本阶段不实现：

- 真实 API 调用
- OpenAI-compatible Provider
- ProfileAgent
- 多智能体
- 学习画像生成
- 学习路径生成
- 资源生成
- 智能辅导
- 测验批改
- RAG
- embedding
- 登录

## 测试

```bash
pytest
ruff check .
mypy app tests
```
