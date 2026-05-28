# Phase 12 前端体验打磨与人工测试清单

## 1. 阶段目标

Phase 12 的目标是让 EduForge 在比赛录屏、答辩和提交前更容易被人工检查。当前系统已经完成知识库、学习画像、学习路径、资源生成、智能辅导、练习测验和学习评估闭环，本阶段不新增业务能力，而是补齐前端状态提示、人工测试清单和轻量 Smoke Status。

## 2. 为什么此阶段不做交付材料

最终 PPT、视频脚本、系统开发说明书和测试说明书需要建立在稳定演示流程之上。Phase 12 先解决“现场是否可控”的问题：页面是否能清晰提示当前模式、哪些数据已经准备好、哪些操作可能调用真实 Spark、哪些步骤还需要人工验证。

## 3. /api/qa/checklist

`GET /api/qa/checklist` 返回人工测试清单，不执行任何生成类操作，不调用 LLM，不调用 Spark。

测试项覆盖演示工作台、知识库、学习画像、学习路径、资源生成、智能辅导、练习测验、学习评估和 LLM 模式。每个测试项包含模块、标题、访问路径、预期结果、优先级、是否需要 LLM、是否可能调用 Spark 和操作提示。

## 4. /api/qa/smoke-status

`GET /api/qa/smoke-status` 是只读接口，只检查数据库和配置状态，包括 Student、Course、KnowledgePoint、DocumentChunk、LearnerProfile、LearningPath、GeneratedResource、Tutor、Practice、EvaluationReport 和 LLM 模式配置。

该接口不调用 `/api/llm/generate`，不调用任何 Agent，不调用 Spark，也不修改数据库。

## 5. /qa 页面

`/qa` 页面用于团队在录屏、答辩或提交前逐项检查功能链路。页面包含当前 Mock / Spark 模式提示、Smoke Status 卡片、按模块分组的人工测试项、本地勾选“已通过”、勾选进度条和“前往页面”跳转按钮。

勾选状态只保存在浏览器内存中，刷新会重置，不写入后端。

## 6. 人工测试清单使用方式

建议流程：

1. 打开 `/demo`，准备基础演示数据。
2. 打开 `/qa`，查看 Smoke Status。
3. 按清单进入 `/knowledge-base`、`/profile`、`/learning-path`、`/resources`、`/tutor`、`/practice`、`/analytics`。
4. 每完成一个检查项，在 `/qa` 中勾选“已通过”。
5. 录屏或答辩前重点确认高优先级项目。

## 7. Spark Lite 真实模式提醒

本地可以保持：

```env
USE_MOCK_LLM=false
LLM_PROVIDER=spark-http
SPARK_MODEL=lite
SPARK_HTTP_API_PASSWORD=只放在本地 .env
```

`/qa` 和 `/api/qa/*` 不会自动调用模型。若当前是 spark-http 模式，前端会提示：手动点击画像、路径、资源、辅导、测验等生成类操作会调用真实 API，可能受网络、并发或额度策略影响。

## 8. 高消耗操作确认策略

`/resources` 在 spark-http 模式下批量生成多个资源类型前，会显示确认区。用户需要勾选“我确认要执行该生成操作”后才能继续，避免误触多次真实模型调用。

`/practice` 在生成测验区域显示真实模型调用提示，但不阻断用户操作。

## 9. APIPassword 安全要求

- 不提交 `.env`
- 不提交 APIPassword
- 不在前端输入 key
- 不在日志输出 key
- 不把 key 粘贴到 Codex 提示词里
- 不把 key 写进 README、docs、测试、截图或聊天记录
- 后端响应只显示是否配置，不返回密钥内容

## 10. 本阶段没有做

- 没有生成 PPT
- 没有生成视频脚本
- 没有写最终系统开发说明书
- 没有做 Docker
- 没有做登录
- 没有新增 Agent
- 没有新增真实外部 API 类型
- 没有自动跑完整 AI 流程

## 11. 验收方式

```powershell
python scripts/check-env.py
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

页面验收：

- `/qa` 能展示 Smoke Status。
- `/qa` 能展示人工测试清单并本地勾选。
- `/qa` 不自动调用 LLM 或 Spark。
- `/resources` 在 spark-http 模式下批量生成前有确认提示。
- 页面和接口不出现 APIPassword。

## 12. 下一阶段建议

下一阶段可由团队决定：

- Phase 13：最终交付材料初稿
- Phase 13：UI 细节继续打磨
