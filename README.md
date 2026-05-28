# EduForge 智学工坊

基于大模型的个性化资源生成与学习多智能体系统。项目面向第十五届中国软件杯 A3 赛题，由科大讯飞股份有限公司出题。

EduForge 定位为面向高校课程学习场景的 AI 个性化学习资源工厂：学生通过自然语言生成 8 维学习画像，系统基于课程知识库和智能体协作规划学习路径、生成学习资源、提供智能辅导，并通过练习测验和自动批改更新掌握度。

## 当前阶段

当前为第十阶段：PracticeAgent + EvaluatorAgent 学习效果评估。

已完成能力：

- Conda + FastAPI + Next.js 工程骨架
- SQLite + SQLModel 数据底座
- 原创《数据库系统》示例知识库
- MockLLMProvider 和 SparkProvider 预留
- ProfileAgent 对话式学习画像
- PlannerAgent 个性化学习路径
- ResourceAgent 六类资源生成
- TutorAgent 带引用来源的智能辅导
- PracticeAgent 多题型练习生成
- EvaluatorAgent 自动批改、错因分析、掌握度更新
- LearningEvaluationReport 和 Analytics 学习分析

仍未实现：

- 未接入真实讯飞星火 API
- 未配置真实 API Key
- 未调用任何外部大模型 API
- 未实现复杂考试系统、防作弊、班级管理、登录、Docker
- 不使用出版教材 PDF、扫描件或教材原文

## 环境

- Conda 环境名：`cnsoftbei_a3_eduforge`
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
- Dashboard：http://localhost:3000/dashboard
- 学习画像：http://localhost:3000/profile
- 学习路径：http://localhost:3000/learning-path
- 资源生成：http://localhost:3000/resources
- 智能辅导：http://localhost:3000/tutor
- 练习测验：http://localhost:3000/practice
- 学习评估：http://localhost:3000/analytics
- Swagger：http://localhost:8000/docs

## 第十阶段 API

- `GET /api/practice/question-types`
- `POST /api/practice/quizzes/generate`
- `GET /api/practice/quizzes`
- `GET /api/practice/quizzes/{quiz_id}`
- `POST /api/evaluation/attempts/submit`
- `GET /api/evaluation/attempts`
- `GET /api/evaluation/attempts/{attempt_id}`
- `GET /api/evaluation/reports`
- `GET /api/evaluation/reports/{report_id}`
- `GET /api/evaluation/analytics?student_id=1&course_id=1`

## 验收

```powershell
python scripts/check-env.py
.\scripts\check-phase10.ps1
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

1. 打开 `/knowledge-base`，导入《数据库系统》示例资料。
2. 打开 `/profile`，生成 8 维学习画像。
3. 打开 `/learning-path`，生成学习路径。
4. 打开 `/resources`，为某个学习步骤生成资源。
5. 打开 `/tutor`，围绕幻读、B+树、JOIN 提问。
6. 打开 `/practice`，选择学习路径 step，生成测验并提交答案。
7. 打开 `/analytics`，查看准确率、掌握度变化、薄弱点和评估报告。

## 版权边界

仓库中的 `data/sample_courses/database_system/` 为团队原创整理内容。项目不提交出版教材 PDF、扫描版教材、电子书、出版社配套资料或教材原文摘录。
