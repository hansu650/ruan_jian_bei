# EduForge API

EduForge 智学工坊后端服务。第三阶段接入 SQLite + SQLModel，提供数据底座与最小 CRUD API。

## 技术栈

- Python 3.11
- FastAPI
- SQLModel
- SQLite
- Uvicorn
- pytest
- ruff
- mypy

## 安装依赖

```bash
cd apps/api
python -m pip install --upgrade pip
pip install -r requirements.txt
pip install -r requirements-dev.txt
pip install -e .
```

## 启动

```bash
cd apps/api
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

启动时会自动创建 `apps/api/eduforge.db` 并写入默认 seed 数据。数据库文件不会提交到 Git。

## 当前结构

```text
app/
  core/
    config.py
  db/
    database.py
    models.py
    seed.py
  routers/
    health.py
    meta.py
    students.py
    courses.py
    knowledge_points.py
    profile_drafts.py
    resource_items.py
  schemas/
  main.py
```

## 当前接口

- `GET /api/health`
- `GET /api/meta`
- `GET /api/students`
- `POST /api/students`
- `GET /api/students/{student_id}`
- `GET /api/courses`
- `POST /api/courses`
- `GET /api/courses/{course_id}`
- `GET /api/courses/{course_id}/knowledge-points`
- `POST /api/courses/{course_id}/knowledge-points`
- `GET /api/profile-drafts`
- `POST /api/profile-drafts`
- `GET /api/resource-items`
- `POST /api/resource-items`

## 检查

```bash
pytest
ruff check .
mypy app tests
```

## 当前阶段不做

第三阶段不实现 RAG、文件上传、LLM Provider、MockLLM、Agent、学习画像生成、学习路径生成、资源生成、智能辅导、测验批改、登录、权限、Docker 或 Alembic。
