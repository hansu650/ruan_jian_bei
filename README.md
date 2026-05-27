# EduForge 智学工坊

基于大模型的个性化资源生成与学习多智能体系统。

## 赛题信息

- 比赛：第十五届中国软件杯
- 赛题：A3 赛题
- 赛题名称：基于大模型的个性化资源生成与学习多智能体系统开发
- 出题企业：科大讯飞股份有限公司

## 项目定位

EduForge 智学工坊是面向高校课程学习场景的 AI 个性化学习资源工厂。学生通过自然语言对话生成动态学习画像，系统后续将基于课程知识库和多智能体协作，自动规划个性化学习路径，生成讲义、思维导图、练习题、实操案例、拓展材料和视频讲解脚本，并通过测验反馈动态更新画像和资源推荐策略。

## A3 题面要求摘要

- 对话式学习画像：学生通过自然语言描述专业、目标、基础、偏好、薄弱点等信息，系统抽取特征并构建动态画像。
- 多智能体协同资源生成：通过不同角色智能体协作完成学习资源生成。
- 至少 5 类个性化资源：例如讲义、思维导图、练习题、拓展阅读、实操案例、视频脚本等。
- 个性化学习路径规划和资源推送：根据画像、课程内容、学习进度和薄弱点生成动态路径。
- 智能辅导：支持学生提问，基于课程知识库提供即时答疑。
- 学习效果评估：跟踪练习结果和反馈数据，评估知识点掌握度并调整计划。
- 防幻觉与内容安全：回答应有知识库依据，后续需要引用来源和校验机制。
- 生成进度或流式输出：资源生成不能长时间白屏，需要进度提示或流式呈现。
- 初赛交付：文档、PPT、7 分钟内演示视频和可完整运行的源码与配置。

## 当前阶段

第一阶段仅完成环境准备和项目规范初始化，不包含正式业务功能。当前后端只提供一个极简 FastAPI health check 接口，用于验证 Python 环境、依赖安装和服务启动是否正常。

本阶段未实现学习画像、多智能体、RAG、资源生成、学习路径、测验批改、数据库业务表或真实大模型 API。

## 推荐开发环境

- Conda
- Python 3.11
- Node.js >= 20.9
- pnpm
- Git
- Docker 可选

Docker 在第一阶段不强制配置。建议等后端 API、前端骨架、数据库或知识库目录、统一启动方式稳定后，再补充 `Dockerfile` 和 `docker-compose.yml`，避免早期频繁返工。

## 目录结构

```text
eduforge/
  apps/
    api/
      app/
      tests/
      requirements.txt
      requirements-dev.txt
      pyproject.toml
      README.md
    web/
      README.md
  scripts/
  docs/
  data/
  .env.example
  .gitignore
  README.md
```

## Windows 环境准备

在项目根目录执行：

```powershell
conda create -n cnsoftbei_a3_eduforge python=3.11 -y
conda activate cnsoftbei_a3_eduforge

cd apps/api
python -m pip install --upgrade pip
pip install -r requirements.txt
pip install -r requirements-dev.txt
pip install -e .
```

回到项目根目录：

```powershell
cd ../..
python scripts/check-env.py
```

## macOS/Linux 环境准备

在项目根目录执行：

```bash
conda create -n cnsoftbei_a3_eduforge python=3.11 -y
conda activate cnsoftbei_a3_eduforge

cd apps/api
python -m pip install --upgrade pip
pip install -r requirements.txt
pip install -r requirements-dev.txt
pip install -e .
```

回到项目根目录：

```bash
cd ../..
python scripts/check-env.py
```

## 一键脚本方式

Windows：

```powershell
.\scripts\setup-conda.ps1
```

macOS/Linux：

```bash
chmod +x scripts/setup-conda.sh scripts/run-api-dev.sh scripts/run-web-dev.sh
./scripts/setup-conda.sh
```

脚本完成后按提示执行：

```bash
conda activate cnsoftbei_a3_eduforge
python scripts/check-env.py
```

## 环境自检

```bash
python scripts/check-env.py
```

自检脚本会检查 Python、Conda、pip、FastAPI、uvicorn、pytest、Node.js、pnpm、Git、Docker 和关键项目文件。Docker 与 pnpm 在第一阶段不是阻塞项；Node.js 需要满足后续前端开发要求。

## 后端启动

方式一：在后端目录直接启动。

```bash
cd apps/api
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

方式二：使用启动脚本。

Windows：

```powershell
.\scripts\run-api-dev.ps1
```

macOS/Linux：

```bash
./scripts/run-api-dev.sh
```

## 打开接口

- Health check：[http://localhost:8000/api/health](http://localhost:8000/api/health)
- Swagger 文档：[http://localhost:8000/docs](http://localhost:8000/docs)

预期 health check 返回：

```json
{
  "status": "ok",
  "service": "eduforge-api",
  "project": "EduForge 智学工坊",
  "competition": "中国软件杯 A3"
}
```

## 运行测试

```bash
cd apps/api
pytest
```

## 环境变量

复制 `.env.example` 为本地 `.env` 后按需填写：

```bash
cp .env.example .env
```

不要提交 `.env`，不要在仓库中保存真实 API Key。

## 后续阶段计划

- 第二阶段：前后端项目骨架
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

## 当前开源依赖记录

第一阶段仅引入轻量基础依赖：

- FastAPI：后端 Web 框架
- Uvicorn：ASGI 开发服务器
- Pydantic / pydantic-settings：数据校验与配置基础
- python-dotenv：本地环境变量加载
- httpx：后续服务调用与测试基础
- Typer：后续脚本命令行能力预留
- pytest / pytest-cov：测试
- ruff：代码风格检查
- mypy：类型检查

后续若使用其他开源项目或 AI 工具，需要在文档中继续补充名称、来源和协议。
