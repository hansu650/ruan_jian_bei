# EduForge 智学工坊

基于大模型的个性化资源生成与学习多智能体系统。

## 赛题信息

- 比赛：第十五届中国软件杯
- 赛题：A3 - 基于大模型的个性化资源生成与学习多智能体系统开发
- 出题企业：科大讯飞股份有限公司
- 项目定位：面向高校课程学习场景的 AI 个性化学习资源工厂

## 当前阶段

当前处于第四阶段：课程资料与知识库基础。

本阶段已经建设：

- 原创《数据库系统》示例课程资料
- Markdown / TXT 文档解析
- 文本分块
- CourseDocument / DocumentChunk 数据模型
- SQLite 入库
- 基础关键词检索
- 前端 `/knowledge-base` 演示页

本阶段不是完整 RAG，不接入大模型，不使用 embedding，不接 ChromaDB，不实现 Agent。

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

## 后端安装

```powershell
conda create -n cnsoftbei_a3_eduforge python=3.11 -y
conda activate cnsoftbei_a3_eduforge

cd apps/api
python -m pip install --upgrade pip
pip install -r requirements.txt
pip install -r requirements-dev.txt
pip install -e .
```

## 前端安装

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
- [http://localhost:3000/database](http://localhost:3000/database)
- [http://localhost:3000/courses](http://localhost:3000/courses)
- [http://localhost:3000/students](http://localhost:3000/students)
- [http://localhost:3000/knowledge-base](http://localhost:3000/knowledge-base)

后端：

- [http://localhost:8000/api/health](http://localhost:8000/api/health)
- [http://localhost:8000/api/meta](http://localhost:8000/api/meta)
- [http://localhost:8000/api/courses](http://localhost:8000/api/courses)
- [http://localhost:8000/api/students](http://localhost:8000/api/students)
- [http://localhost:8000/docs](http://localhost:8000/docs)

第四阶段 API：

- `GET /api/courses/{course_id}/documents`
- `POST /api/courses/{course_id}/documents/import-sample`
- `POST /api/courses/{course_id}/documents/upload`
- `GET /api/courses/{course_id}/documents/{document_id}/chunks`
- `GET /api/courses/{course_id}/knowledge-base/stats`
- `GET /api/courses/{course_id}/knowledge-base/search?q=幻读`

## 示例资料目录

```text
data/sample_courses/database_system/
  01_intro.md
  02_relational_model.md
  03_sql_basic.md
  04_sql_join.md
  05_er_model.md
  06_normalization.md
  07_transaction.md
  08_index_btree.md
  09_query_optimization.md
  10_exam_review.md
```

上传文件保存到 `apps/api/storage/uploads/`，该目录不提交 Git。SQLite 数据库默认生成在 `apps/api/eduforge.db`，也不提交 Git。

## 验收命令

根目录自检：

```powershell
python scripts/check-env.py
```

第四阶段一键检查：

```powershell
.\scripts\check-phase4.ps1
```

macOS/Linux：

```bash
./scripts/check-phase4.sh
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
2. 打开 `/knowledge-base`。
3. 选择或默认使用《数据库系统》课程。
4. 点击“导入《数据库系统》示例资料”。
5. 查看文档数和 chunk 数。
6. 搜索“幻读”，应看到事务与并发控制相关片段。
7. 搜索“B+树”，应看到索引与 B+ 树相关片段。
8. 搜索“JOIN”，应看到 JOIN 与子查询相关片段。
9. 上传一个 `.txt` 或 `.md` 文件，确认可以解析并分块。

## 后续阶段计划

- 第五阶段：LLM Provider 与 Mock 模型
- 后续：向量检索或 RAG 编排
- 后续：对话式学习画像
- 后续：个性化学习路径
- 后续：多类型资源生成
- 后续：智能辅导、防幻觉引用来源
- 后续：测验批改与学习效果评估
