# Phase 10.1 讯飞星火 HTTP 可选接入

## 1. 阶段目标

A3 赛题出题企业是科大讯飞。为了让 EduForge 更贴合赛题背景，本阶段增加讯飞星火 HTTP Provider 的可选接入能力。

本阶段只做 Provider 能力补充，不进入交付材料阶段，也不改变第十阶段的练习测验与学习效果评估闭环。

## 2. 为什么默认仍然使用 Mock

- 避免开发阶段产生费用。
- 避免没有 API Key 时无法演示。
- 保证自动化测试稳定。
- 方便离线开发和团队成员本地协作。
- 保证 `/profile`、`/learning-path`、`/resources`、`/tutor`、`/practice`、`/analytics` 在无 Key 环境下仍可运行。

## 3. Provider 设计

新增文件：

- `apps/api/app/llm/spark_http_provider.py`

Provider 名称：

- `spark-http`

接口形式：

- HTTP Chat Completions
- 非流式调用
- `Authorization: Bearer <APIPassword>`

默认地址：

```text
https://spark-api-open.xf-yun.com/v1/chat/completions
```

默认模型：

```text
lite
```

## 4. 本地配置方式

默认配置仍为：

```env
USE_MOCK_LLM=true
LLM_PROVIDER=mock
LLM_MODEL=mock-edu-model
```

如需本地切换讯飞星火 HTTP Provider，在 `.env` 中配置：

```env
USE_MOCK_LLM=false
LLM_PROVIDER=spark-http
SPARK_HTTP_API_URL=https://spark-api-open.xf-yun.com/v1/chat/completions
SPARK_HTTP_API_PASSWORD=自己的 APIPassword
SPARK_MODEL=lite
```

如果 `LLM_PROVIDER=spark-http` 但未配置 `SPARK_HTTP_API_PASSWORD`，系统会自动回退 MockLLMProvider，并在 `/api/llm/status` 中返回 warning。

## 5. Spark Lite / Pro-128K 区别

- `lite`：优先用于开发调试和低成本演示。
- `pro-128k`：适合长上下文测试，但需要注意额度消耗。

实际可用模型以讯飞开放平台控制台为准，例如 `lite`、`generalv3`、`pro-128k`、`generalv3.5`、`max-32k`、`4.0Ultra`。

## 6. 如何获取 APIPassword

参考流程：

1. 前往讯飞星火产品页面领取或购买额度。
2. 前往讯飞开放平台控制台。
3. 进入对应应用或服务配置页面。
4. 获取 HTTP APIPassword。
5. 将 APIPassword 只写入本地 `.env`。

具体入口和字段名称以讯飞官方控制台为准。

## 7. 安全要求

- 不提交 `.env`。
- 不提交 APIPassword。
- 不在前端输入 key。
- 不在日志输出 key。
- 不把 key 粘贴到 Codex 提示词里。
- 不把 key 发到 GitHub issue、README、截图或聊天记录中。
- 自动化测试不使用真实 APIPassword。

`/api/llm/status` 只返回：

- `spark_http_configured: true | false`

不会返回 APIPassword 原文。

## 8. 当前限制

- 只实现 HTTP 非流式调用。
- 不实现 WebSocket。
- 不实现 Function Call。
- 不启用联网搜索。
- 不实现讯飞知识库 API。
- 不实现流式输出。
- 不使用 OpenAI SDK。
- 不使用 LangChain。
- 不接 ChromaDB。

## 9. 验收方式

默认 Mock 验收：

```powershell
python scripts/check-env.py
.\scripts\check-phase10-1.ps1
```

手动验证 fallback：

```env
USE_MOCK_LLM=false
LLM_PROVIDER=spark-http
SPARK_HTTP_API_PASSWORD=
```

启动后访问：

```text
http://localhost:8000/api/llm/status
```

预期：

- `effective_provider=mock`
- `spark_http_configured=false`
- `warning=SPARK_HTTP_API_PASSWORD 未配置，已回退 MockLLMProvider`

真实讯飞验证只允许本地手动执行，不写入自动化测试。

## 10. 下一步

Phase 10.1 完成后，再进入第十一阶段：系统收尾、演示流程、文档、PPT 大纲和视频脚本。
# Phase 11 衔接说明

Phase 10.1 后先进入 Phase 11：端到端演示工作台与稳定性打磨。

Phase 11 允许本地继续使用 spark-http + lite，但 `/demo` 不会自动调用模型。只有用户手动进入画像、路径、资源、辅导、练习等页面并点击生成类按钮时，才会触发真实 API 调用。

自动化测试会强制 Mock 或 mock 外部请求，不真实调用讯飞 API，也不要求配置 APIPassword。
