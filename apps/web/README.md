# EduForge Web

Next.js + TypeScript + Tailwind CSS 前端。当前新增第十阶段页面：

- `/practice`：练习测验，生成题目、填写答案、提交自动批改。
- `/analytics`：学习效果评估，展示测验次数、平均准确率、掌握度和评估报告。

## 安装和启动

```powershell
cd apps/web
pnpm install
pnpm dev
```

环境变量：

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

## 页面

- `/profile`：对话式学习画像
- `/learning-path`：个性化学习路径
- `/resources`：多类型资源生成
- `/tutor`：智能辅导与引用校验
- `/practice`：练习测验
- `/analytics`：学习效果评估
- `/llm-lab`：模型实验室，可查看 MockLLM 和可选 spark-http Provider 状态

前端不使用 axios、react-query、复杂状态管理或图表库；表单和答题状态使用 React `useState`。

## Phase 10.1 说明

`/llm-lab` 会展示 `spark_http_configured`，用于确认后端是否配置了讯飞星火 HTTP APIPassword。

前端不会提供 API Key 输入框，也不会保存或发送密钥。真实 APIPassword 只允许放在本地后端 `.env` 中：

```env
USE_MOCK_LLM=false
LLM_PROVIDER=spark-http
SPARK_HTTP_API_PASSWORD=你的 APIPassword
SPARK_MODEL=lite
```

默认不配置时继续使用 MockLLM，不产生费用。
