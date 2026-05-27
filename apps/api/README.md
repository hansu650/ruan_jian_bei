# EduForge API

FastAPI 后端服务，当前处于第四阶段：课程资料与知识库基础。

## 技术栈

- Python 3.11
- FastAPI
- Pydantic v2
- SQLModel
- SQLite
- pytest / ruff / mypy

## 安装

```bash
conda activate cnsoftbei_a3_eduforge
cd apps/api
pip install -r requirements.txt
pip install -r requirements-dev.txt
pip install -e .
```

`pip install -e .` 用于可编辑安装，方便本地修改 `app/` 后直接运行测试和服务。

## 启动

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## 当前 API

基础：

- `GET /api/health`
- `GET /api/meta`

数据底座：

- `GET /api/students`
- `POST /api/students`
- `GET /api/courses`
- `POST /api/courses`
- `GET /api/courses/{course_id}/knowledge-points`
- `POST /api/courses/{course_id}/knowledge-points`
- `GET /api/profile-drafts`
- `POST /api/profile-drafts`
- `GET /api/resource-items`
- `POST /api/resource-items`

知识库基础：

- `GET /api/courses/{course_id}/documents`
- `POST /api/courses/{course_id}/documents/import-sample`
- `POST /api/courses/{course_id}/documents/upload`
- `GET /api/courses/{course_id}/documents/{document_id}/chunks`
- `GET /api/courses/{course_id}/knowledge-base/stats`
- `GET /api/courses/{course_id}/knowledge-base/search?q=幻读`

## 第四阶段边界

当前只支持 Markdown 和 TXT 文档解析、分块、入库和关键词检索。

本阶段不实现：

- RAG
- embedding
- ChromaDB
- LLM Provider
- Agent
- 学习画像生成
- 学习路径生成
- 资源生成
- 智能辅导
- 测验批改
- 登录
- Docker
- Alembic

## 数据与存储

- 示例课程资料：`data/sample_courses/database_system/`
- 上传文件目录：`apps/api/storage/uploads/`
- SQLite 文件：`apps/api/eduforge.db`

上传目录和数据库文件不提交 Git。

## 测试

```bash
pytest
ruff check .
mypy app tests
```
