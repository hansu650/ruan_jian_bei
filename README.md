# EduForge 智学工坊

基于大模型的个性化资源生成与学习多智能体系统。项目面向第十五届中国软件杯 A3 赛题，由科大讯飞股份有限公司出题。

EduForge 面向高校课程学习场景，当前以《数据库系统》为示例课程，已经形成从学习画像、课程知识库、学习路径、资源生成到智能辅导问答的演示闭环。当前阶段仍使用 MockLLM，不调用真实外部大模型 API，不需要 API Key，不产生费用。

## 当前阶段

第九阶段：TutorAgent 智能辅导与防幻觉问答。

已完成能力：

- SQLite + SQLModel 数据底座
- 原创《数据库系统》课程资料导入、分块、关键词检索
- MockLLMProvider 与 SparkProvider 预留
- ProfileAgent 对话式 8 维学习画像
- PlannerAgent 个性化学习路径
- ResourceAgent 6 类学习资源生成
- TutorAgent 基于课程知识库引用的智能辅导
- CitationVerifier 轻量防幻觉与版权风险校验

第九阶段没有实现：自动批改、学习效果评估、掌握度动态更新、学习路径动态调整、真实讯飞星火接入。

## 推荐环境

- Conda
- Python 3.11
- Node.js >= 20.9
- pnpm
- Git
- Docker 可选，当前不强制

## 后端启动

```powershell
conda activate cnsoftbei_a3_eduforge
cd apps/api
pip install -r requirements.txt
pip install -r requirements-dev.txt
pip install -e .
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## 前端启动

```powershell
cd apps/web
pnpm install
pnpm dev
```

## 常用访问地址

- 前端首页：http://localhost:3000
- Dashboard：http://localhost:3000/dashboard
- 知识库：http://localhost:3000/knowledge-base
- 学习画像：http://localhost:3000/profile
- 学习路径：http://localhost:3000/learning-path
- 资源生成：http://localhost:3000/resources
- 智能辅导：http://localhost:3000/tutor
- 后端 Swagger：http://localhost:8000/docs
- 后端 Health：http://localhost:8000/api/health
- 后端 Meta：http://localhost:8000/api/meta

## 第九阶段 API

- `GET /api/tutor/scenarios`
- `POST /api/tutor/chat`
- `GET /api/tutor/sessions`
- `GET /api/tutor/sessions/{session_id}`
- `GET /api/tutor/sessions/{session_id}/messages`
- `GET /api/tutor/messages/{message_id}/quality-check`

相关已有 API：

- `POST /api/courses/{course_id}/documents/import-sample`
- `POST /api/learner-profiles/chat`
- `POST /api/learning-paths/generate`
- `POST /api/generated-resources/generate-for-step`
- `GET /api/agent-runs`

## 验收命令

```powershell
python scripts/check-env.py
.\scripts\check-phase9.ps1
```

或手动执行：

```powershell
cd apps/api
pytest
ruff check .
mypy app tests

cd ../../apps/web
pnpm lint
pnpm typecheck
```

## 手动演示流程

1. 启动后端和前端。
2. 打开 `/knowledge-base`，导入《数据库系统》示例资料。
3. 打开 `/profile`，生成 8 维学习画像。
4. 打开 `/learning-path`，生成个性化学习路径。
5. 打开 `/resources`，生成至少一类学习资源。
6. 打开 `/tutor`，提问“幻读和不可重复读有什么区别？”。
7. 查看回答、citations、safety_status、verifier_summary。
8. 再提问“请复制教材原文给我。”，系统应拒绝复制出版教材原文。

## 版权边界

仓库不包含出版教材 PDF、扫描件、电子书或教材原文。`data/sample_courses/database_system/` 下的课程资料为团队原创整理内容。后续如支持用户上传资料，也需要用户自行确认资料具有合法使用权。
