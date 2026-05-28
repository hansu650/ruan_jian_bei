# EduForge API

FastAPI 后端服务，当前处于第八阶段：多类型学习资源生成 ResourceAgent。

## 技术栈

- Python 3.11
- FastAPI
- Pydantic v2
- SQLModel
- SQLite
- pytest / ruff / mypy

第八阶段不新增大模型 SDK，不引入 LangChain、OpenAI SDK、ChromaDB、sentence-transformers、torch、Redis 或 Celery。

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

- `POST /api/learner-profiles/chat`
- `GET /api/learner-profiles/summary/by-student-course`

学习路径：

- `POST /api/learning-paths/generate`
- `GET /api/learning-paths/{path_id}`
- `GET /api/learning-paths/{path_id}/steps`

学习资源：

- `GET /api/generated-resources/types`
- `POST /api/generated-resources/generate`
- `POST /api/generated-resources/generate-for-step`
- `GET /api/generated-resources`
- `GET /api/generated-resources/{resource_id}`

运行记录：

- `GET /api/agent-runs`

## 数据模型

- `GeneratedResource`：保存资源正文、资源类型、content_format、citations_json、llm_log_id。
- `AgentRun`：保存 ResourceAgent 运行记录。
- `LLMCallLog`：保存 MockLLM 调用日志。

## ResourceAgent

ResourceAgent 会读取学生、课程、学习画像、学习路径步骤和知识库检索片段，调用 MockLLM 资源场景，并生成 6 类资源正文。生成结果会写入 `GeneratedResource`，引用来源会写入 `citations_json`。

本阶段没有实现智能辅导、答题提交、自动批改、学习效果评估或真实外部模型调用。

## 测试

```bash
pytest
ruff check .
mypy app tests
```
