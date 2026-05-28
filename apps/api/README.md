# EduForge API

FastAPI 后端，当前进入 Phase 12：前端体验打磨与人工测试清单。

## 技术栈

- Python 3.11
- FastAPI
- SQLModel
- SQLite
- MockLLMProvider
- SparkHTTPProvider，可选启用，默认不调用真实外部 API

## 安装与启动

```powershell
conda activate cnsoftbei_a3_eduforge
cd apps/api
pip install -r requirements.txt
pip install -r requirements-dev.txt
pip install -e .
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## 检查

```powershell
pytest
ruff check .
mypy app tests
```

## Phase 11 模块

- `app/routers/demo.py`：演示状态和基础数据准备 API。
- `app/services/demo_service.py`：聚合演示数据状态，执行不调用 LLM 的 bootstrap。
- `app/schemas/demo.py`：DemoStatusResponse、DemoBootstrapResponse。
- `app/core/errors.py`：新接口使用的轻量错误辅助函数。

新增 API：

- `GET /api/demo/status`
- `POST /api/demo/bootstrap`

`/api/demo/bootstrap` 只会执行默认 seed 和示例课程资料导入，不会生成画像、路径、资源、辅导消息、测验或评估报告，也不会调用 MockLLM 或 SparkHTTPProvider。

## Phase 12 QA 模块

- `app/routers/qa.py`：人工测试清单和 Smoke Status API。
- `app/services/qa_service.py`：只读数据库和配置，不调用 LLM，不调用 Spark。
- `app/schemas/qa.py`：QAChecklistResponse、QASmokeStatusResponse。

新增 API：

- `GET /api/qa/checklist`
- `GET /api/qa/smoke-status`

`/api/qa/checklist` 只返回人工测试项。`/api/qa/smoke-status` 只检查 Student、Course、KnowledgePoint、DocumentChunk、LearnerProfile、LearningPath、GeneratedResource、Tutor、Practice 和 EvaluationReport 等状态，不修改数据库，不调用任何 Agent 或 LLM Provider。

## LLM 模式

默认 Mock：

```env
USE_MOCK_LLM=true
LLM_PROVIDER=mock
```

本地可选 Spark Lite：

```env
USE_MOCK_LLM=false
LLM_PROVIDER=spark-http
SPARK_HTTP_API_PASSWORD=自己的 APIPassword
SPARK_MODEL=lite
```

后端只返回 `spark_http_configured: true | false`，不会返回 APIPassword。自动化测试通过 `tests/conftest.py` 强制 Mock，避免本地 spark-http 配置导致真实联网。
