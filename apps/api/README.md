# EduForge API

EduForge 智学工坊后端服务。第二阶段已整理基础工程结构，并提供前后端联调用的 health 和 meta 接口。

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
- [http://localhost:8000/api/meta](http://localhost:8000/api/meta)
- [http://localhost:8000/docs](http://localhost:8000/docs)

## 运行测试

```bash
cd apps/api
pytest
```

## 当前阶段接口

- `GET /api/health`：后端健康检查
- `GET /api/meta`：项目和赛题基础信息

当前阶段不包含数据库模型、多智能体、RAG、学习画像、资源生成、学习路径或测验评估。

## 当前结构

```text
app/
  core/
    config.py
  routers/
    health.py
    meta.py
  schemas/
    health.py
    meta.py
  main.py
```

`main.py` 只负责创建 FastAPI app、配置 CORS 和注册路由，不堆业务逻辑。

## 后续会加入

- 数据库模型
- 课程知识库
- LLM Provider
- 多智能体
- RAG
- 测验评估
