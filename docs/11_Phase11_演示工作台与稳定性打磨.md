# Phase 11 演示工作台与稳定性打磨

## 1. 阶段目标

Phase 11 的目标是把已经完成的 A3 核心能力整理成一个可控、可检查、可人工推进的比赛演示入口。

本阶段新增 `/demo` 演示工作台，并新增后端接口：

- `GET /api/demo/status`
- `POST /api/demo/bootstrap`

## 2. 为什么先做演示工作台

当前系统已经完成知识库、画像、路径、资源、辅导、练习和评估闭环。如果直接进入 PPT、视频脚本或最终说明书阶段，容易忽略现场演示时的数据准备和页面跳转稳定性。

演示工作台先解决三个问题：

- 知道默认学生、课程和知识库是否就绪。
- 知道画像、路径、资源、辅导、测验和评估是否已经有演示数据。
- 明确下一步应该跳到哪个页面手动操作。

## 3. /api/demo/status

该接口聚合默认演示数据状态，返回默认学生和课程、当前 LLM 模式、8 个演示步骤状态、overall_ready 和 next_recommended_step。

演示步骤包括：

1. 基础数据
2. 课程知识库
3. 对话式学习画像
4. 个性化学习路径
5. 多类型资源生成
6. 智能辅导
7. 练习测验
8. 学习效果评估

状态值：

- `ready`：可演示
- `warning`：已有部分数据，但不完整
- `missing`：缺少数据

## 4. /api/demo/bootstrap

该接口只准备基础演示数据：

- 默认学生
- 《数据库系统》课程
- 10 个知识点
- 原创 Markdown 示例课程资料导入
- 文档分块入库

该接口不会生成学习画像、学习路径、学习资源、辅导会话、测验或评估报告，也不会调用 MockLLM 或 SparkHTTPProvider。因此即使本地处于 spark-http + lite 真实模式，执行 bootstrap 也不会消耗真实 API。

## 5. /demo 页面

前端 `/demo` 页面展示 LLM 模式、演示准备状态、一键准备基础演示数据按钮、下一步建议和推荐演示路线。页面不会自动跑全流程，也不会自动触发任何生成类接口。

## 6. 演示顺序

推荐现场演示顺序：

1. `/demo` 准备基础数据
2. `/knowledge-base` 搜索“幻读”
3. `/profile` 生成 8 维画像
4. `/learning-path` 生成 7 天路径
5. `/resources` 生成 6 类资源
6. `/tutor` 提问“幻读和不可重复读有什么区别？”
7. `/practice` 生成测验并提交
8. `/analytics` 查看评估报告

## 7. Mock / Spark 模式

Mock 模式不调用外部 API，适合离线演示和自动化测试。

Spark Lite 真实模式允许本地继续使用：

```env
USE_MOCK_LLM=false
LLM_PROVIDER=spark-http
SPARK_MODEL=lite
SPARK_HTTP_API_PASSWORD=只放在本地 .env
```

真实模式下，手动点击画像、路径、资源、辅导、测验等生成按钮会调用真实 API；`/demo` 本身不会自动批量调用模型。

## 8. APIPassword 安全要求

- 不提交 `.env`
- 不提交 APIPassword
- 不在前端输入 key
- 不在日志输出 key
- 不把 key 粘贴到 Codex 提示词里
- 不把 key 发到 GitHub issue、README、截图或聊天记录中

接口和页面只显示 `spark_http_configured`，不会显示密钥内容。

## 9. 本阶段没有做

- 没有生成 PPT
- 没有生成演示视频脚本
- 没有生成最终系统开发说明书
- 没有新增 Docker
- 没有新增登录或权限
- 没有新增 Agent
- 没有新增真实外部 API 类型

## 10. 验收方式

```powershell
python scripts/check-env.py
.\scripts\check-phase11.ps1
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

## 11. 下一阶段建议

团队可以二选一：

- Phase 12：前端细节打磨与人工测试清单
- Phase 12：交付材料初稿

是否进入最终交付材料阶段由团队决定。

## 12. Phase 12 衔接说明

团队已选择先进入 Phase 12：前端体验打磨与人工测试清单，而不是直接进入最终交付材料阶段。

Phase 12 新增：

- `GET /api/qa/checklist`
- `GET /api/qa/smoke-status`
- `/qa` 人工测试清单页面
- Spark 模式下高消耗操作确认提示

这些能力用于录屏或答辩前逐项核对系统状态，不会自动调用 LLM 或 Spark。
