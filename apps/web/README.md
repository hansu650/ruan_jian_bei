# EduForge Web

Next.js + TypeScript + Tailwind CSS 前端。当前进入 Phase 13 端到端彩排与缺陷修复。

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

- `/demo`：演示工作台，检查端到端演示准备状态。
- `/qa`：人工测试清单，展示 Smoke Status 和本地勾选进度。
- `/knowledge-base`：课程知识库和关键词检索。
- `/profile`：对话式学习画像。
- `/learning-path`：个性化学习路径。
- `/resources`：多类型学习资源生成。
- `/tutor`：智能辅导与引用校验。
- `/practice`：练习测验。
- `/analytics`：学习效果评估。
- `/llm-lab`：模型实验室，可查看 MockLLM 和可选 spark-http Provider 状态。

## Phase 11 前端组件

- `components/empty-state.tsx`
- `components/error-state.tsx`
- `components/loading-state.tsx`
- `components/model-mode-badge.tsx`
- `components/demo-step-card.tsx`

`/demo` 页面不会自动调用生成类接口，不会自动调用 Spark，也不会接触 APIPassword。真实 Key 只允许放在后端本地 `.env`。

## Phase 12 前端组件

- `components/page-header.tsx`
- `components/citation-list.tsx`
- `components/json-preview.tsx`
- `components/markdown-preview.tsx`
- `components/live-model-warning.tsx`
- `components/action-confirm-card.tsx`

`/qa` 页面不会自动调用生成接口，不会调用 Spark。`/resources` 在 spark-http 模式下批量生成多个资源前会显示确认提示，避免比赛联调时误触多次真实模型调用。

## Phase 13 前端检查点

- Dashboard 当前阶段显示 Phase 13。
- `/qa` 继续用于人工测试清单和 Smoke Status。
- `/llm-lab`、`/demo` 和 `/qa` 不显示或传输后端密钥。
- `/resources` 在 spark-http 模式下保留高消耗操作确认。
- 资源相关 API 文案统一为 `/api/generated-resources/*`。
