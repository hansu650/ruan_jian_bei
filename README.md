# EduForge 智学工坊

EduForge 智学工坊是第十五届中国软件杯 A3 赛题项目，赛题为“基于大模型的个性化资源生成与学习多智能体系统开发”，出题企业为科大讯飞股份有限公司。

项目定位为面向高校课程学习场景的 AI 个性化学习资源工厂。当前已经形成核心学习闭环：课程知识库、对话式学习画像、个性化学习路径、多类型学习资源生成、智能辅导、练习测验、自动批改和学习效果评估。

## 当前阶段

当前阶段为 **Phase 16C：导航点击修复 + 学生端极简 UI 壳重写**。

已完成能力：

- FastAPI + Next.js + TypeScript + Tailwind CSS 工程骨架
- SQLite + SQLModel 数据底座
- 原创《数据库系统》示例课程资料和知识库分块检索
- MockLLMProvider 和可选 SparkHTTPProvider
- ProfileAgent 对话式 8 维学习画像
- PlannerAgent 个性化学习路径
- ResourceAgent 6 类学习资源生成
- TutorAgent 智能辅导与 citations 防幻觉提示
- PracticeAgent 练习生成
- EvaluatorAgent 自动批改、掌握度更新和学习效果评估
- `/demo` 演示工作台，用于检查端到端演示准备状态
- `/qa` 人工测试清单和 Smoke Status，用于录屏、答辩或提交前逐项核对
- Phase 13 彩排修复：统一 generated-resources API 命名、模型模式提示和密钥外显风险
- Phase 14A 学生端体验修复：`/learn` 学习工作台、导航高亮、Markdown/Mermaid 渲染和资源内容阅读体验
- Phase 14B 学生端体验修补：资源预览清理、Mermaid 渲染兜底、学习评估列表化和 spark-http 批量生成确认
- Phase 15A 产品化包装：`/agents-flow` 多智能体协作视图、`/innovation` 创新亮点页和学生端 UI 升级
- Phase 15B 全局 UI 重构：统一导航、卡片、指标、状态标签和核心学习页面视觉，让系统更像正式学习产品
- Phase 16A 全站 UI V2：重写学生端 app shell、左侧导航、顶部课程栏、首页、学习工作台和学习资源页布局
- Phase 16C 导航修复：学生端改为顶部导航 + 居中内容，移除学生端左侧导航，修复核心学习入口跳转

仍未进入最终交付材料阶段：本阶段不生成 PPT、演示视频脚本、最终系统开发说明书，也不做 Docker 部署。

## 环境

- Conda 环境：`cnsoftbei_a3_eduforge`
- Python：3.11
- Node.js：>= 20.9
- 前端包管理器：pnpm
- 数据库：SQLite，默认文件 `apps/api/eduforge.db`

```powershell
conda create -n cnsoftbei_a3_eduforge python=3.11 -y
conda activate cnsoftbei_a3_eduforge

cd apps/api
python -m pip install --upgrade pip
pip install -r requirements.txt
pip install -r requirements-dev.txt
pip install -e .

cd ../web
pnpm install
```

## 启动

终端 1：

```powershell
conda activate cnsoftbei_a3_eduforge
.\scripts\run-api-dev.ps1
```

终端 2：

```powershell
.\scripts\run-web-dev.ps1
```

访问地址：

- 前端首页：http://localhost:3000
- 学习工作台：http://localhost:3000/learn
- 演示工作台：http://localhost:3000/demo
- 测试清单：http://localhost:3000/qa
- Dashboard：http://localhost:3000/dashboard
- 知识库：http://localhost:3000/knowledge-base
- 学习画像：http://localhost:3000/profile
- 学习路径：http://localhost:3000/learning-path
- 资源生成：http://localhost:3000/resources
- 智能辅导：http://localhost:3000/tutor
- 练习测验：http://localhost:3000/practice
- 学习评估：http://localhost:3000/analytics
- 智能体协作：http://localhost:3000/agents-flow
- 创新亮点：http://localhost:3000/innovation
- Swagger：http://localhost:8000/docs

## Phase 11 演示工作台

新增 API：

- `GET /api/demo/status`：检查默认演示数据、知识库、画像、路径、资源、辅导、测验和评估状态。
- `POST /api/demo/bootstrap`：准备基础演示数据，只确保默认学生、课程、知识点和原创示例资料就绪。

`/demo` 页面会显示：

- 当前 LLM 模式：Mock 或 spark-http
- Spark Lite 真实模式提示
- 每个演示步骤的 ready、warning、missing 状态
- “准备基础演示数据”按钮
- 下一步建议和推荐演示路线

注意：`/demo` 不会自动生成画像、路径、资源、辅导回答或测验，也不会自动调用 MockLLM 或真实 Spark。真实 Spark 模式下，只有用户手动进入生成类页面并点击生成按钮才会发起真实 API 调用。

## Phase 12 人工测试清单

新增 API：

- `GET /api/qa/checklist`：返回人工测试清单，不执行任何生成类操作。
- `GET /api/qa/smoke-status`：轻量读取数据库和配置，检查核心演示数据状态。

新增前端页面：

- `/qa`：展示 Smoke Status、按模块分组的人工测试项、本地勾选进度和 Mock/Spark 模式提示。

`/qa` 不会自动调用 LLM，也不会自动调用 Spark。真实 Spark Lite 模式下，页面只提醒“手动点击生成类操作会调用真实 API”，不会显示、输入、保存或传输真实密钥。

## Phase 13 端到端彩排

Phase 13 不新增业务功能，重点检查：

- `/demo` 和 `/qa` 是否能指导完整人工彩排。
- 前后端和文档中的 API 路径是否一致，资源生成接口统一使用 `/api/generated-resources/*`。
- Mock 和 Spark Lite 两种模式下的提示是否清晰。
- 高消耗操作在真实 Spark 模式下是否有提示或确认。
- 自动化测试是否仍然强制 Mock 或 mock 外部请求。
- 页面、接口响应和日志是否避免暴露真实密钥。

## Phase 14A 学生端 UI 与内容渲染

Phase 14A 不新增 Agent、不新增数据模型、不接入新的真实 API，重点修复学生端体验：

- `/learn` 作为学生端主入口，展示课程、画像、今日任务、学习进度、薄弱点和下一步行动。
- 顶部导航按当前路径高亮，学习中心入口优先，演示、测试和管理入口降级。
- `MarkdownPreview` 使用 `react-markdown` 和 `remark-gfm` 渲染讲义、练习、实操案例和模型输出。
- `MermaidDiagram` 支持思维导图代码块渲染，渲染失败时回退显示源码。
- `/resources`、`/tutor`、`/practice`、`/analytics` 优先展示中文状态、引用来源、进度条和学习诊断，不把 JSON 或工程字段作为主视觉。

## Phase 14B 学生端体验修补与资源展示

Phase 14B 继续聚焦前端体验，不新增业务能力：

- `/resources` 资源详情继续使用 Markdown 渲染，Mermaid 图渲染失败时有兜底源码提示。
- 资源列表预览会清理 Markdown 标题、代码围栏、SQL 和 Mermaid 原文，避免看起来像半成品。
- `/resources` 默认只选择讲义资源类型；spark-http 真实模式下选择多个资源类型需要确认后才能批量生成。
- `/learn` 去掉“演示数据”这类后台视角文案，改为“学习流程”和“学习数据”表达。
- `/analytics` 将补救建议展示为行动列表，掌握度继续用进度条展示。
- 当前导航高亮进一步增强，帮助学生知道自己位于哪个学习环节。

## Phase 15A 学生端 UI 升级与创新点包装

Phase 15A 不新增 Agent、不新增后端业务能力，重点把已有功能包装成更容易理解的比赛作品：

- `/learn` 继续作为学生端主入口，强化“当前课程、今日任务、薄弱点、继续学习、学习评估”。
- `/agents-flow` 展示 ProfileAgent、PlannerAgent、ResourceAgent、TutorAgent、PracticeAgent、EvaluatorAgent 与 CitationVerifier 的协作链路。
- `/innovation` 将真实实现能力整理为画像驱动闭环、可信课程知识库、多智能体学习流水线、六类资源生成、轻量掌握度追踪、Mock/Spark 双模式和引用来源防幻觉。
- 首页增加智能体协作和创新亮点入口，但学生学习入口仍优先。
- Dashboard 增加架构与亮点入口，便于评委或团队成员理解系统结构。
- 不把费曼学习法、BKT、情感感知、多 Agent 辩论等未实现能力写成已完成。

## Phase 15B 全局 UI 重构与学习产品视觉升级

Phase 15B 继续不新增业务大功能，重点把前端从“功能模块集合”收敛为“学生学习产品”：

- 首页 `/` 更像正式产品入口，主行动指向 `/learn`。
- `/learn` 强化今日任务、学习进度、薄弱点和继续学习。
- `/resources` 资源列表更像学习资料卡，默认只选择讲义，避免真实 Spark 模式下误触批量生成。
- `/tutor`、`/practice`、`/analytics` 统一使用中文状态、指标卡和学习诊断表达。
- `/agents-flow` 与 `/innovation` 保持比赛讲解入口，但只陈述真实已实现能力。
- 本阶段只借鉴开源项目的布局和信息层级，不复制代码、文案、图片或未授权资产。

## Phase 16A 全站 UI V2 大重构

Phase 16A 继续不新增后端业务功能，重点重写前端产品外壳和核心学生端页面：

- 全局 layout 使用 V2 app shell：左侧学生导航、顶部课程栏和统一内容容器。
- `/` 作为正式产品首页，突出 AI 个性化学习助手和完整学习闭环。
- `/learn` 作为学生端第一入口，展示今日任务、继续学习、学习进度、薄弱点和最近结果。
- `/resources` 更像学习资料页面，资源类型、列表卡片、Markdown/Mermaid 内容和引用来源展示更统一。
- `/agents-flow` 和 `/innovation` 继续服务比赛讲解，强调真实已实现的多智能体协作与创新点。
- 本阶段只借鉴成熟 dashboard 与学习平台的布局语言，不复制代码、不复制文案、不虚构未实现功能。

## Phase 16C 导航修复与学生端极简 UI 壳

Phase 16C 聚焦两个 P0/P1 体验问题：导航点击和学生端布局外壳。

- 学生端路由使用顶部导航和居中内容，不再渲染左侧大 sidebar。
- `/learn`、`/profile`、`/learning-path`、`/resources`、`/tutor`、`/practice`、`/analytics` 都是明确可点击的顶部导航项。
- 当前页面使用浅蓝高亮，便于学生知道自己所在学习环节。
- `/demo`、`/qa`、`/dashboard`、`/database`、`/courses`、`/students`、`/llm-lab`、`/health` 走简化管理壳，不影响学生端。
- 本阶段不新增后端业务、不新增 Agent、不触发真实 Spark 生成。

## 可选讯飞星火 HTTP 接入

默认配置仍为 Mock：

```env
USE_MOCK_LLM=true
LLM_PROVIDER=mock
LLM_MODEL=mock-edu-model
```

本地可以可选切换到讯飞星火 HTTP 方式，具体配置放在本机 `.env`，不要写入仓库或文档截图。

安全要求：

- 不提交 `.env`
- 不提交真实密钥
- 不在前端输入、传输或保存 API Key
- 不把 Key 写进 README、测试、日志、截图、Issue 或聊天记录
- 自动化测试强制 Mock 或 mock 掉 httpx，不真实调用讯飞 API

## 主要 API

- `GET /api/demo/status`
- `POST /api/demo/bootstrap`
- `GET /api/qa/checklist`
- `GET /api/qa/smoke-status`
- `GET /api/llm/status`
- `POST /api/learner-profiles/chat`
- `POST /api/learning-paths/generate`
- `POST /api/generated-resources/generate`
- `POST /api/tutor/chat`
- `POST /api/practice/quizzes/generate`
- `POST /api/evaluation/attempts/submit`
- `GET /api/evaluation/analytics?student_id=1&course_id=1`

## 验收

```powershell
python scripts/check-env.py
.\scripts\check-phase11.ps1
.\scripts\check-phase12.ps1
.\scripts\check-phase13.ps1
.\scripts\check-phase14a.ps1
.\scripts\check-phase14b.ps1
.\scripts\check-phase15a.ps1
.\scripts\check-phase15b.ps1
.\scripts\check-phase16a.ps1
.\scripts\check-phase16c.ps1
```

或手动执行：

```powershell
cd apps/api
pytest
ruff check .
mypy app tests

cd ../web
pnpm lint
pnpm typecheck
```

## 演示流程

1. 打开 `/demo`，检查当前 LLM 模式和各模块状态。
2. 点击“准备基础演示数据”，导入原创《数据库系统》示例资料。
3. 打开 `/qa`，查看 Smoke Status 和人工测试清单。
4. 打开 `/knowledge-base`，搜索“幻读”。
5. 打开 `/profile`，生成 8 维学习画像。
6. 打开 `/learning-path`，生成 7 天学习路径。
7. 打开 `/resources`，生成 6 类学习资源。
8. 打开 `/tutor`，提问“幻读和不可重复读有什么区别？”。
9. 打开 `/practice`，生成测验并提交答案。
10. 打开 `/analytics`，查看掌握度变化和评估报告。

## 版权边界

仓库中的 `data/sample_courses/database_system/` 为团队原创整理内容。项目不提交出版教材 PDF、扫描版教材、电子书、出版社配套资料或教材原文摘录。
