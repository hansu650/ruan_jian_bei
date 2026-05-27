# EduForge 智学工坊

基于大模型的个性化资源生成与学习多智能体系统。

## 赛题信息

- 比赛：第十五届中国软件杯
- 赛题：A3 - 基于大模型的个性化资源生成与学习多智能体系统开发
- 出题企业：科大讯飞股份有限公司
- 项目定位：面向高校课程学习场景的 AI 个性化学习资源工厂

## 当前阶段

当前处于第五阶段：MockLLM 与讯飞接口预留。

本阶段已经建设：

- LLMProvider 抽象接口
- MockLLMProvider 离线演示模型
- SparkProvider 预留类
- LLM 调用日志 `LLMCallLog`
- Prompt 模板目录
- LLM 测试 API
- 前端 `/llm-lab` 模型实验室

当前不接真实外部 API，不需要 API Key，不产生费用。不调用 OpenAI、DeepSeek、通义、讯飞星火真实接口或任何外部模型服务。

## 已完成基础

- SQLite + SQLModel 数据底座
- 《数据库系统》原创示例课程资料
- Markdown / TXT 文档解析、分块、入库
- 基础关键词检索
- `/knowledge-base` 知识库页面
- `/database`、`/courses`、`/students` 基础数据页面

## 版权与资料边界

`data/sample_courses/database_system/` 下的示例课程资料为项目原创整理内容，只参考数据库系统通用知识体系，不包含出版教材 PDF、扫描件、出版社配套资料、教材原文或大段摘录。

不要把出版书籍、课程教材 PDF、扫描版教材、电子书放入仓库。后续如果支持用户上传资料，也应由用户自行保证资料具有合法使用权。

## 推荐环境

- Conda
- Python 3.11
- Node.js >= 20.9
- pnpm
- Git
- Docker 可选，当前不配置

## LLM 环境变量

`.env.example` 中默认：

```env
USE_MOCK_LLM=true
LLM_PROVIDER=mock
LLM_MODEL=mock-edu-model
LLM_TIMEOUT_SECONDS=60

SPARK_APP_ID=
SPARK_API_KEY=
SPARK_API_SECRET=
SPARK_MODEL=
```

`USE_MOCK_LLM=true` 时系统总是使用 MockLLM。Spark 相关变量只是为后续根据 A3 答疑群要求接入科大讯飞相关工具预留，当前不会调用真实接口，也不会在日志或响应中输出密钥。

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

后端：

```powershell
conda activate cnsoftbei_a3_eduforge
.\scripts\run-api-dev.ps1
```

前端：

```powershell
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

后端：

- [http://localhost:8000/api/health](http://localhost:8000/api/health)
- [http://localhost:8000/api/meta](http://localhost:8000/api/meta)
- [http://localhost:8000/api/llm/status](http://localhost:8000/api/llm/status)
- [http://localhost:8000/api/llm/scenarios](http://localhost:8000/api/llm/scenarios)
- [http://localhost:8000/api/llm/logs](http://localhost:8000/api/llm/logs)
- [http://localhost:8000/docs](http://localhost:8000/docs)

LLM API：

- `GET /api/llm/status`
- `GET /api/llm/scenarios`
- `POST /api/llm/generate`
- `POST /api/llm/chat`
- `GET /api/llm/logs`

## 验收命令

根目录自检：

```powershell
python scripts/check-env.py
```

第五阶段一键检查：

```powershell
.\scripts\check-phase5.ps1
```

macOS/Linux：

```bash
./scripts/check-phase5.sh
```

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

## 手动演示流程

1. 启动后端和前端。
2. 打开 `/llm-lab`。
3. 查看 LLM Provider 状态，应显示 mock。
4. 确认页面说明当前不接真实 API、不需要 API Key、不产生费用。
5. 选择 profile 场景并点击 Generate，看到模拟学习画像 JSON。
6. 选择 resource_note 场景并点击 Generate，看到 Markdown 讲义。
7. 使用 Chat 测试答疑回复。
8. 查看 LLM 调用日志。
9. 确认没有真实 API Key 泄露，也没有真实外部 API 调用。

## 后续阶段计划

- 第六阶段：对话式学习画像 ProfileAgent
- 后续：个性化学习路径
- 后续：多类型资源生成
- 后续：智能辅导、防幻觉引用来源
- 后续：测验批改与学习效果评估
