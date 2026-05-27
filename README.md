# EduForge 智学工坊

基于大模型的个性化资源生成与学习多智能体系统。

## 赛题信息

- 比赛：第十五届中国软件杯
- 赛题：A3 - 基于大模型的个性化资源生成与学习多智能体系统开发
- 出题企业：科大讯飞股份有限公司

## 项目定位

EduForge 智学工坊是面向高校课程学习场景的 AI 个性化学习资源工厂。后续系统将支持对话式学习画像、课程知识库 RAG、多智能体协作、个性化学习路径、多类型学习资源生成、智能辅导、测验批改、学习效果评估和防幻觉引用来源。

## 当前阶段

当前处于第三阶段：数据库模型与基础 CRUD。

已完成：

- FastAPI 后端基础结构：`core / db / routers / schemas`
- SQLite 数据库：默认文件 `apps/api/eduforge.db`
- SQLModel 数据模型：Student、Course、KnowledgePoint、ProfileDraft、ResourceItem
- 启动时自动初始化数据库并写入默认 seed
- 最小 CRUD API：列表、创建、详情或按课程查询
- Next.js 前端数据页面：`/database`、`/courses`、`/students`
- 前后端 health/meta 联调仍保留

本阶段只做数据底座，不实现 RAG、课程资料上传、LLM Provider、MockLLM、Agent、学习画像生成、学习路径生成、资源生成、智能辅导、测验批改、登录、权限、Docker 或 Alembic。

## 推荐开发环境

- Conda
- Python 3.11
- Node.js >= 20.9
- pnpm
- Git
- Docker 可选，当前阶段不配置

## 后端环境准备

```powershell
conda create -n cnsoftbei_a3_eduforge python=3.11 -y
conda activate cnsoftbei_a3_eduforge

cd apps/api
python -m pip install --upgrade pip
pip install -r requirements.txt
pip install -r requirements-dev.txt
pip install -e .
```

## 前端环境准备

```bash
corepack enable
corepack prepare pnpm@latest --activate

cd apps/web
pnpm install
```

## 启动服务

终端 1 启动后端：

```powershell
conda activate cnsoftbei_a3_eduforge
.\scripts\run-api-dev.ps1
```

终端 2 启动前端：

```powershell
.\scripts\run-web-dev.ps1
```

也可以手动启动：

```bash
cd apps/api
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

cd apps/web
pnpm dev
```

## 后端 API

- Health：[http://localhost:8000/api/health](http://localhost:8000/api/health)
- Meta：[http://localhost:8000/api/meta](http://localhost:8000/api/meta)
- Students：[http://localhost:8000/api/students](http://localhost:8000/api/students)
- Courses：[http://localhost:8000/api/courses](http://localhost:8000/api/courses)
- Knowledge Points：`http://localhost:8000/api/courses/{course_id}/knowledge-points`
- Profile Drafts：[http://localhost:8000/api/profile-drafts](http://localhost:8000/api/profile-drafts)
- Resource Items：[http://localhost:8000/api/resource-items](http://localhost:8000/api/resource-items)
- Swagger：[http://localhost:8000/docs](http://localhost:8000/docs)

## 前端页面

- 首页：[http://localhost:3000](http://localhost:3000)
- Dashboard：[http://localhost:3000/dashboard](http://localhost:3000/dashboard)
- Health：[http://localhost:3000/health](http://localhost:3000/health)
- 数据底座：[http://localhost:3000/database](http://localhost:3000/database)
- 课程管理：[http://localhost:3000/courses](http://localhost:3000/courses)
- 学生管理：[http://localhost:3000/students](http://localhost:3000/students)

## 数据库说明

- 数据库：SQLite
- ORM：SQLModel
- 默认数据库文件：`apps/api/eduforge.db`
- 数据库文件不会提交到 Git，`.gitignore` 已忽略 `*.db`
- 后端启动时会自动执行 `SQLModel.metadata.create_all(engine)` 并写入 seed 数据
- 当前不使用 Alembic，后续部署形态稳定后再考虑迁移工具

## 默认 Seed 数据

- 默认学生：示例学生
- 默认课程：数据库系统
- 默认知识点：数据库基础、关系模型、SQL 基础、JOIN 与子查询、ER 建模、函数依赖与范式、事务与并发控制、索引与 B+ 树、查询优化、综合复习
- 默认画像草稿：7 天掌握数据库系统期末重点
- 默认资源占位：讲义、思维导图、练习题、实操案例、视频脚本

## 检查命令

后端：

```bash
cd apps/api
pytest
ruff check .
mypy app tests
```

前端：

```bash
cd apps/web
pnpm lint
pnpm typecheck
```

根目录自检：

```bash
python scripts/check-env.py
```

一键检查第三阶段：

Windows：

```powershell
.\scripts\check-phase3.ps1
```

macOS/Linux：

```bash
./scripts/check-phase3.sh
```

## 后续阶段计划

- 第四阶段：课程资料与知识库基础
- 第五阶段：LLM Provider 与 Mock 模型
- 第六阶段：对话式学习画像
- 第七阶段：个性化学习路径
- 第八阶段：多类型学习资源生成
- 第九阶段：智能辅导与防幻觉
- 第十阶段：测验批改与学习效果评估
- 第十一阶段：前端演示优化
- 第十二阶段：文档、PPT、演示视频脚本
