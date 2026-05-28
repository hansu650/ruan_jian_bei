# EduForge API

FastAPI 后端，当前已进入第十阶段：PracticeAgent + EvaluatorAgent 学习效果评估。

## 技术栈

- Python 3.11
- FastAPI
- SQLModel
- SQLite
- MockLLMProvider

## 安装

```powershell
conda activate cnsoftbei_a3_eduforge
cd apps/api
pip install -r requirements.txt
pip install -r requirements-dev.txt
pip install -e .
```

`pip install -e .` 用于可编辑安装，方便测试和开发时直接导入 `app` 包。

## 启动与检查

```powershell
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
pytest
ruff check .
mypy app tests
```

## 第十阶段模块

- `app/agents/practice_agent.py`：根据画像、路径 step 和知识库生成原创练习。
- `app/agents/evaluator_agent.py`：自动批改、错因分析、掌握度更新。
- `app/routers/practice.py`：练习生成与查询 API。
- `app/routers/evaluation.py`：提交答案、报告和 analytics API。
- `app/schemas/practice.py`、`app/schemas/evaluation.py`：Pydantic schema。

当前仍只使用 MockLLM，不调用真实外部 API，不需要真实 Key。
