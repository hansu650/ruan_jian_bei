# EduForge Web

Next.js + TypeScript + Tailwind CSS 前端。当前新增 Phase 11 演示工作台。

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
