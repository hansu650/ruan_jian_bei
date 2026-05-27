# EduForge 智学工坊

基于大模型的个性化资源生成与学习多智能体系统。

## 赛题信息

- 比赛：第十五届中国软件杯
- 赛题：A3 - 基于大模型的个性化资源生成与学习多智能体系统开发
- 出题企业：科大讯飞股份有限公司

## 项目定位

EduForge 智学工坊是面向高校课程学习场景的 AI 个性化学习资源工厂。学生后续将通过自然语言对话生成动态学习画像，系统基于课程知识库和多智能体协作，规划个性化学习路径，生成讲义、思维导图、练习题、实操案例、拓展材料和视频讲解脚本，并通过测验反馈动态更新画像和推荐策略。

## 当前阶段

当前处于第二阶段：前端骨架与前后端联调。

已完成：

- 后端 FastAPI 基础结构整理
- `/api/health`
- `/api/meta`
- CORS 支持 `localhost:3000`
- Next.js + TypeScript + Tailwind CSS + shadcn/ui 前端骨架
- 首页、Dashboard、Health 页面
- 前端直连后端 health/meta 接口
- pnpm workspace 基础配置
- 第二阶段检查脚本与文档更新

Phase 2.1 收尾修复：

- `scripts/check-env.py` 已适配第二阶段前端项目，会检查 pnpm、前端 package、关键页面、`lib/api.ts` 和后端 router/config 文件。
- `.env.example` 与后端 `Settings` 保持一致，包含 `FRONTEND_ORIGIN=http://localhost:3000`。
- 后端 `Settings` 同时兼容 `apps/api/.env` 和项目根目录 `.env`。
- CORS methods 已为第三阶段基础 CRUD 预留 `GET/POST/PUT/PATCH/DELETE/OPTIONS`。
- Phase 2.1 仍不包含数据库、CRUD、登录、学习画像、多智能体、RAG、LLM Provider 或测验功能。

本阶段不包含数据库、登录、学习画像、多智能体、RAG、资源生成、测验评估或真实大模型 API。

## 推荐开发环境

- Conda
- Python 3.11
- Node.js >= 20.9
- pnpm
- Git
- Docker 可选

Docker 当前仍不强制配置。建议等后端、前端、数据库或知识库目录、统一启动方式稳定后，再补充 `Dockerfile` 和 `docker-compose.yml`。

## 目录结构

```text
apps/
  api/
    app/
      core/
      routers/
      schemas/
      main.py
    tests/
  web/
    app/
    components/
    lib/
scripts/
docs/
data/
```

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

也可以使用脚本：

```powershell
.\scripts\setup-conda.ps1
```

macOS/Linux：

```bash
chmod +x scripts/setup-conda.sh scripts/run-api-dev.sh scripts/run-web-dev.sh
./scripts/setup-conda.sh
```

## 前端环境准备

如果 pnpm 未安装：

```bash
corepack enable
corepack prepare pnpm@latest --activate
```

安装前端依赖：

```bash
cd apps/web
pnpm install
```

## 环境自检

在项目根目录执行：

```bash
python scripts/check-env.py
```

第二阶段自检会检查 Python、Conda、后端依赖、Node.js、pnpm、Git、Docker、前端 package、pnpm 锁文件和关键页面文件。Docker 缺失只会显示 WARN。

## 启动后端

```bash
cd apps/api
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

或使用脚本：

Windows：

```powershell
.\scripts\run-api-dev.ps1
```

macOS/Linux：

```bash
./scripts/run-api-dev.sh
```

## 启动前端

```bash
cd apps/web
pnpm dev
```

或使用脚本：

Windows：

```powershell
.\scripts\run-web-dev.ps1
```

macOS/Linux：

```bash
./scripts/run-web-dev.sh
```

## 前后端同时启动

终端 1：

```powershell
conda activate cnsoftbei_a3_eduforge
.\scripts\run-api-dev.ps1
```

终端 2：

```powershell
.\scripts\run-web-dev.ps1
```

macOS/Linux：

```bash
conda activate cnsoftbei_a3_eduforge
./scripts/run-api-dev.sh
./scripts/run-web-dev.sh
```

## 访问地址

- 前端首页：[http://localhost:3000](http://localhost:3000)
- 前端 Health 页面：[http://localhost:3000/health](http://localhost:3000/health)
- 前端 Dashboard：[http://localhost:3000/dashboard](http://localhost:3000/dashboard)
- 后端 Swagger：[http://localhost:8000/docs](http://localhost:8000/docs)
- 后端 Health：[http://localhost:8000/api/health](http://localhost:8000/api/health)
- 后端 Meta：[http://localhost:8000/api/meta](http://localhost:8000/api/meta)

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
pnpm build
```

一键检查：

Windows：

```powershell
.\scripts\check-phase2.ps1
```

macOS/Linux：

```bash
./scripts/check-phase2.sh
```

## 第二阶段验收标准

- `/api/health` 返回 `status=ok` 和 `stage=phase-2`
- `/api/meta` 返回 A3 赛题基础信息
- 前端首页展示 EduForge、A3 赛题信息、核心闭环和后端状态
- `/dashboard` 展示比赛演示风格的功能骨架和阶段进度
- `/health` 展示前端状态、后端 health/meta 返回结果和失败提示
- `python scripts/check-env.py` 使用第二阶段规则检查前后端环境
- 后端 `pytest`、`ruff check .`、`mypy app tests` 通过
- 前端 `pnpm lint`、`pnpm typecheck` 通过
- 项目中没有提前实现正式业务功能

## 后续阶段计划

- 第三阶段：数据库模型与基础 CRUD
- 第四阶段：课程资料与知识库
- 第五阶段：LLM Provider 与 Mock 模型
- 第六阶段：对话式学习画像
- 第七阶段：个性化学习路径
- 第八阶段：多类型学习资源生成
- 第九阶段：智能辅导与防幻觉
- 第十阶段：测验批改与学习效果评估
- 第十一阶段：前端演示优化
- 第十二阶段：文档、PPT、演示视频脚本
