# EduForge 智学工坊

EduForge 智学工坊是面向第十五届中国软件杯 A3 赛题“基于大模型的个性化资源生成与学习多智能体系统开发”的比赛项目，出题企业为科大讯飞股份有限公司。项目定位为面向高校课程学习场景的 AI 个性化学习资源工厂。

## 当前阶段

当前处于第八阶段：多类型学习资源生成 ResourceAgent。

已完成能力包括：

- FastAPI + Conda + Python 3.11 后端工程环境
- Next.js + TypeScript + Tailwind CSS + shadcn/ui 前端骨架
- SQLite + SQLModel 数据底座
- 原创《数据库系统》示例课程资料、Markdown/TXT 解析、分块入库和关键词检索
- MockLLMProvider、SparkProvider 预留、LLMCallLog 和 `/llm-lab`
- ProfileAgent 对话式学习画像，支持 8 维动态画像
- PlannerAgent 个性化学习路径，支持 LearningPath / LearningPathStep、薄弱点覆盖检查和资源类型推荐
- ResourceAgent 多类型学习资源生成，支持 GeneratedResource 和 citations_json

第八阶段仍然只使用 MockLLM，不调用真实外部 API，不需要 API Key，不产生费用。

## 资源类型

ResourceAgent 当前支持 6 类资源：

- `lecture_note`：专业课程讲义
- `mindmap`：知识点思维导图，使用 Markdown fenced code block 保存 mermaid mindmap
- `quiz`：练习题草稿
- `reading`：拓展阅读材料
- `practice_case`：SQL/代码实操案例
- `video_script`：短视频/动画讲解脚本

每个资源都会保存到 `GeneratedResource`，并通过 `citations_json` 记录来源 chunk。

## 阶段边界

本阶段只做资源内容生成，不做智能辅导聊天、答题提交、自动批改、学习效果评估、路径动态调整、完整多智能体编排、真实 RAG、embedding、ChromaDB 或真实讯飞星火 API 接入。

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
- [http://localhost:3000/resources](http://localhost:3000/resources)
- [http://localhost:3000/knowledge-base](http://localhost:3000/knowledge-base)

后端：

- [http://localhost:8000/api/health](http://localhost:8000/api/health)
- [http://localhost:8000/api/meta](http://localhost:8000/api/meta)
- [http://localhost:8000/api/generated-resources](http://localhost:8000/api/generated-resources)
- [http://localhost:8000/api/generated-resources/types](http://localhost:8000/api/generated-resources/types)
- [http://localhost:8000/docs](http://localhost:8000/docs)

## ResourceAgent API

- `GET /api/generated-resources/types`
- `POST /api/generated-resources/generate`
- `POST /api/generated-resources/generate-for-step`
- `GET /api/generated-resources`
- `GET /api/generated-resources/{resource_id}`

这些接口会基于 LearnerProfile、LearningPathStep、Course 和 DocumentChunk 检索结果生成资源正文，并保存 citations。

## 验收

根目录自检：

```powershell
python scripts/check-env.py
```

第八阶段一键检查：

```powershell
.\scripts\check-phase8.ps1
```

macOS/Linux：

```bash
./scripts/check-phase8.sh
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
2. 打开 `/knowledge-base`，导入《数据库系统》示例资料。
3. 打开 `/profile`，生成 8 维学习画像。
4. 打开 `/learning-path`，生成个性化学习路径。
5. 打开 `/resources`，选择某个学习路径 step。
6. 选择 6 类资源并点击生成。
7. 查看资源正文、资源类型、citations_json 引用来源和 ResourceAgent 运行记录。

下一阶段计划：第九阶段，智能辅导 TutorAgent。
