# EduForge 智学工坊

EduForge 智学工坊是面向第十五届中国软件杯 A3 赛题“基于大模型的个性化资源生成与学习多智能体系统开发”的比赛项目，出题企业为科大讯飞股份有限公司。项目定位为面向高校课程学习场景的 AI 个性化学习资源工厂。

## 当前阶段

当前处于第七阶段：个性化学习路径 PlannerAgent。

已完成能力包括：

- FastAPI + Conda + Python 3.11 后端工程环境
- Next.js + TypeScript + Tailwind CSS + shadcn/ui 前端骨架
- SQLite + SQLModel 数据底座
- 原创《数据库系统》示例课程资料、Markdown/TXT 解析、分块入库和关键词检索
- MockLLMProvider、SparkProvider 预留、LLMCallLog 和 `/llm-lab`
- ProfileAgent 对话式学习画像，支持 8 维动态画像
- PlannerAgent 个性化学习路径，支持 LearningPath / LearningPathStep、薄弱点覆盖检查和资源类型推荐

第七阶段仍然只使用 MockLLM，不调用真实外部 API，不需要 API Key，不产生费用。

## 阶段边界

本阶段只做学习路径规划和资源类型推荐，不生成具体资源内容。项目尚未实现 ResourceAgent、TutorAgent、测验批改、完整多智能体编排、真实 RAG、embedding、ChromaDB 或真实讯飞星火 API 接入。

项目不提交教材 PDF、扫描件、出版教材原文或真实 API Key。

## 安装

后端：

```powershell
conda create -n cnsoftbei_a3_eduforge python=3.11 -y
conda activate cnsoftbei_a3_eduforge

cd apps/api
python -m pip install --upgrade pip
pip install -r requirements.txt
pip install -r requirements-dev.txt
pip install -e .
```

前端：

```powershell
corepack enable
corepack prepare pnpm@latest --activate

cd apps/web
pnpm install
```

## 启动

Windows：

```powershell
.\scripts\run-api-dev.ps1
.\scripts\run-web-dev.ps1
```

macOS/Linux：

```bash
./scripts/run-api-dev.sh
./scripts/run-web-dev.sh
```

## 访问地址

前端：

- [http://localhost:3000](http://localhost:3000)
- [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
- [http://localhost:3000/profile](http://localhost:3000/profile)
- [http://localhost:3000/learning-path](http://localhost:3000/learning-path)
- [http://localhost:3000/knowledge-base](http://localhost:3000/knowledge-base)
- [http://localhost:3000/llm-lab](http://localhost:3000/llm-lab)

后端：

- [http://localhost:8000/api/health](http://localhost:8000/api/health)
- [http://localhost:8000/api/meta](http://localhost:8000/api/meta)
- [http://localhost:8000/api/learner-profiles](http://localhost:8000/api/learner-profiles)
- [http://localhost:8000/api/learning-paths](http://localhost:8000/api/learning-paths)
- [http://localhost:8000/api/agent-runs](http://localhost:8000/api/agent-runs)
- [http://localhost:8000/docs](http://localhost:8000/docs)

## PlannerAgent API

- `POST /api/learning-paths/generate`
- `GET /api/learning-paths`
- `GET /api/learning-paths/{path_id}`
- `GET /api/learning-paths/{path_id}/steps`
- `GET /api/learning-paths/{path_id}/plan-check`

这些接口会基于 LearnerProfile、Student、Course、KnowledgePoint 和少量 DocumentChunk 摘要生成阶段化学习路径。返回内容包含步骤顺序、学习目标、知识点、预计耗时、推荐资源类型和掌握标准。

## 验收

根目录自检：

```powershell
python scripts/check-env.py
```

第七阶段一键检查：

```powershell
.\scripts\check-phase7.ps1
```

macOS/Linux：

```bash
./scripts/check-phase7.sh
```

手动检查：

```bash
cd apps/api
pytest
ruff check .
mypy app tests

cd ../web
pnpm lint
pnpm typecheck
```

## 演示流程

1. 启动后端和前端。
2. 打开 `/profile`，使用示例输入生成 8 维学习画像。
3. 打开 `/learning-path`，确认读取到“示例学生”和“数据库系统”的画像。
4. 将 `target_days` 设置为 7，点击生成个性化学习路径。
5. 查看 6-8 个学习步骤，重点确认 JOIN、事务隔离级别、B+ 树索引等薄弱点被覆盖。
6. 查看每个步骤的推荐资源类型、掌握标准和路径完整性检查。
7. 在 AgentRun 中确认能看到 PlannerAgent 运行记录。

下一阶段计划：第八阶段，多类型学习资源生成 ResourceAgent。
