# EduForge 智学工坊

EduForge 智学工坊是第十五届中国软件杯 A3 赛题项目，赛题为“基于大模型的个性化资源生成与学习多智能体系统开发”，出题企业为科大讯飞股份有限公司。

项目定位为面向高校课程学习场景的 AI 个性化学习资源工厂。当前已经形成核心学习闭环：课程知识库、对话式学习画像、个性化学习路径、多类型学习资源生成、智能辅导、练习测验、自动批改和学习效果评估。

## 当前阶段

当前阶段为 **Phase 12：前端体验打磨与人工测试清单**。

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

`/qa` 不会自动调用 LLM，也不会自动调用 Spark。真实 Spark Lite 模式下，页面只提醒“手动点击生成类操作会调用真实 API”，不会显示、输入、保存或传输 APIPassword。

## 可选讯飞星火 HTTP 接入

默认配置仍为 Mock：

```env
USE_MOCK_LLM=true
LLM_PROVIDER=mock
LLM_MODEL=mock-edu-model
```

本地可以可选切换到讯飞星火 HTTP APIPassword 方式：

```env
USE_MOCK_LLM=false
LLM_PROVIDER=spark-http
SPARK_HTTP_API_URL=https://spark-api-open.xf-yun.com/v1/chat/completions
SPARK_HTTP_API_PASSWORD=自己的 APIPassword
SPARK_MODEL=lite
```

安全要求：

- 不提交 `.env`
- 不提交 APIPassword
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
