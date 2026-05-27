# EduForge API

EduForge 智学工坊后端服务，第一阶段仅用于验证 Python 后端环境和 FastAPI 启动链路。

## 技术栈

- Python 3.11
- FastAPI
- Uvicorn
- Pydantic
- pytest
- ruff
- mypy

## Conda 环境

统一环境名：

```bash
cnsoftbei_a3_eduforge
```

创建并激活：

```bash
conda create -n cnsoftbei_a3_eduforge python=3.11 -y
conda activate cnsoftbei_a3_eduforge
```

## 安装依赖

```bash
cd apps/api
python -m pip install --upgrade pip
pip install -r requirements.txt
pip install -r requirements-dev.txt
pip install -e .
```

`pip install -e .` 会以可编辑模式安装后端包。这样本地修改 `app/` 下的代码后，不需要重新安装包即可被测试和开发服务器识别，适合比赛项目快速迭代。

## 启动 FastAPI

```bash
cd apps/api
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

访问：

- [http://localhost:8000/api/health](http://localhost:8000/api/health)
- [http://localhost:8000/docs](http://localhost:8000/docs)

## 运行测试

```bash
cd apps/api
pytest
```

## 当前阶段范围

第一阶段只有 health check：

- `GET /api/health`

当前阶段不包含正式业务路由、数据库模型、多智能体、RAG、学习画像、资源生成、学习路径或测验评估。

## 后续会加入

- 数据库模型
- 课程知识库
- LLM Provider
- 多智能体
- RAG
- 测验评估
