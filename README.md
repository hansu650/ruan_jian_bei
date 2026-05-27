# EduForge 智学工坊

基于大模型的个性化资源生成与学习多智能体系统。项目面向第十五届中国软件杯 A3 赛题，由科大讯飞股份有限公司出题，定位为面向高校课程学习场景的 AI 个性化学习资源工厂。

## 当前阶段

当前处于第六阶段：对话式学习画像 ProfileAgent。

已完成内容：

- Conda + Python 3.11 后端环境与 FastAPI 基础服务
- Next.js + TypeScript + Tailwind CSS 前端骨架
- SQLite + SQLModel 数据底座
- 原创《数据库系统》示例课程资料、Markdown/TXT 解析、分块、入库和关键词检索
- MockLLMProvider、SparkProvider 预留、LLMCallLog 和 `/llm-lab`
- ProfileAgent 对话式学习画像
- LearnerProfile、ProfileChatMessage、AgentRun
- `/profile` 页面，可通过自然语言生成并更新 8 维画像

第六阶段仍然只使用 MockLLM，不调用真实外部 API，不需要 API Key，不产生费用。

## 8 维学习画像

ProfileAgent 当前生成并更新以下 8 个维度：

- 专业背景
- 学习目标
- 知识基础
- 学习偏好
- 认知风格
- 易错点
- 时间约束
- 知识点掌握度

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
- [http://localhost:3000/knowledge-base](http://localhost:3000/knowledge-base)
- [http://localhost:3000/llm-lab](http://localhost:3000/llm-lab)
- [http://localhost:3000/profile](http://localhost:3000/profile)

后端：

- [http://localhost:8000/api/health](http://localhost:8000/api/health)
- [http://localhost:8000/api/meta](http://localhost:8000/api/meta)
- [http://localhost:8000/api/learner-profiles](http://localhost:8000/api/learner-profiles)
- [http://localhost:8000/api/agent-runs](http://localhost:8000/api/agent-runs)
- [http://localhost:8000/docs](http://localhost:8000/docs)

ProfileAgent API：

- `GET /api/learner-profiles`
- `GET /api/learner-profiles/{profile_id}`
- `POST /api/learner-profiles/chat`
- `GET /api/learner-profiles/summary/by-student-course`
- `GET /api/learner-profiles/dimension-check/by-student-course`
- `GET /api/agent-runs`

## 验收

根目录自检：

```powershell
python scripts/check-env.py
```

第六阶段一键检查：

```powershell
.\scripts\check-phase6.ps1
```

macOS/Linux：

```bash
./scripts/check-phase6.sh
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
2. 打开 `/profile`。
3. 默认选择“示例学生”和“数据库系统”。
4. 点击“填入示例输入”，发送给 ProfileAgent。
5. 查看 8 维画像、掌握度进度条、画像完成度和 AgentRun 运行记录。
6. 再发送“我这周每天只有 1 小时，想优先补事务隔离级别。”，确认画像更新而不是清空。

## 阶段边界

第六阶段没有实现完整多智能体、学习路径规划、资源生成、智能辅导、测验批改、RAG、embedding 或真实讯飞星火接入。项目不提交真实 API Key，不使用出版教材 PDF、扫描件或出版教材原文。

下一阶段计划：第七阶段，个性化学习路径 PlannerAgent。
