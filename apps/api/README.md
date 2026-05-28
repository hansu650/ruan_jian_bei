# EduForge API

FastAPI 后端，当前处于第九阶段：TutorAgent 智能辅导与防幻觉问答。

## 技术栈

- FastAPI
- SQLModel
- SQLite
- Pydantic Settings
- MockLLMProvider

## 启动

```powershell
conda activate cnsoftbei_a3_eduforge
cd apps/api
pip install -r requirements.txt
pip install -r requirements-dev.txt
pip install -e .
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## 第九阶段新增后端模块

- `app/agents/tutor_agent.py`
- `app/agents/citation_verifier.py`
- `app/services/tutor_service.py`
- `app/routers/tutor.py`
- `app/schemas/tutor.py`
- `TutorSession`
- `TutorMessage`

TutorAgent 会基于课程知识库检索结果生成回答，并保存 citations。CitationVerifier 会检查引用是否存在、字段是否完整，以及是否涉及复制教材原文等版权风险。

## API

- `GET /api/tutor/scenarios`
- `POST /api/tutor/chat`
- `GET /api/tutor/sessions`
- `GET /api/tutor/sessions/{session_id}`
- `GET /api/tutor/sessions/{session_id}/messages`
- `GET /api/tutor/messages/{message_id}/quality-check`

## 阶段边界

当前不做自动批改、学生答题提交、学习效果评估、掌握度动态更新或学习路径动态调整。不调用真实外部模型 API，不引入 OpenAI SDK、LangChain、ChromaDB 或 embedding。
