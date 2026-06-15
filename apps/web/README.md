# EduForge Web

Next.js + TypeScript + Tailwind CSS 前端。当前进入 Phase 16A 全站 UI V2 大重构。

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

- `/`：简洁产品首页，引导进入学习工作台。
- `/learn`：学生端学习工作台，展示今日任务、学习进度、薄弱点和下一步行动。
- `/knowledge-base`：课程知识库和关键词检索。
- `/profile`：对话式学习画像。
- `/learning-path`：个性化学习路径。
- `/resources`：多类型学习资源生成。
- `/tutor`：智能辅导与引用校验。
- `/practice`：练习测验。
- `/analytics`：学习效果评估。
- `/agents-flow`：多智能体协作流程视图。
- `/innovation`：创新亮点展示页。
- `/demo`：演示工作台，检查端到端演示准备状态。
- `/qa`：人工测试清单，展示 Smoke Status 和本地勾选进度。
- `/llm-lab`：模型实验室，可查看 MockLLM 和可选 spark-http Provider 状态。

## Phase 11 前端组件

- `components/empty-state.tsx`
- `components/error-state.tsx`
- `components/loading-state.tsx`
- `components/model-mode-badge.tsx`
- `components/demo-step-card.tsx`

`/demo` 页面不会自动调用生成类接口，不会自动调用 Spark，也不会接触真实密钥。真实密钥只允许放在后端本地环境文件中。

## Phase 12 前端组件

- `components/page-header.tsx`
- `components/citation-list.tsx`
- `components/json-preview.tsx`
- `components/markdown-preview.tsx`
- `components/live-model-warning.tsx`
- `components/action-confirm-card.tsx`

`/qa` 页面不会自动调用生成接口，不会调用 Spark。`/resources` 在 spark-http 模式下批量生成多个资源前会显示确认提示，避免比赛联调时误触多次真实模型调用。

## Phase 13 前端检查点

- Dashboard 当前阶段随 `constants.ts` 展示最新建设阶段。
- `/qa` 继续用于人工测试清单和 Smoke Status。
- `/llm-lab`、`/demo` 和 `/qa` 不显示或传输后端密钥。
- `/resources` 在 spark-http 模式下保留高消耗操作确认。
- 资源相关 API 文案统一为 `/api/generated-resources/*`。

## Phase 14A 前端检查点

- `/learn` 是学生端主入口，学习数据来自后端 API，刷新后可继续学习。
- 顶部导航使用当前路径高亮，学习中心入口优先，演示和测试入口降级。
- `components/markdown-preview.tsx` 使用 Markdown 渲染，不再直接展示原始 Markdown。
- `components/mermaid-diagram.tsx` 渲染 `mermaid` 代码块，思维导图不再以源码为主展示。
- `components/citation-list.tsx` 统一展示 filename、section title、chunk 和引用片段。
- 不在前端输入、显示、传输或保存真实密钥。

## Phase 14B 前端检查点

- `/resources` 默认只选择讲义，避免 spark-http 模式下一进页面就全选 6 类资源。
- `/resources` 资源卡片预览会清理 Markdown、SQL 和 Mermaid 源码，只保留适合列表阅读的摘要。
- `components/markdown-preview.tsx` 避免代码块被重复包裹，SQL 代码块有清晰标签。
- `components/mermaid-diagram.tsx` 会清理意外残留的 mermaid 代码围栏，渲染失败时展示兜底源码。
- `/learn` 使用“学习流程基本就绪”等学生视角文案。
- `/analytics` 补救建议以行动列表呈现，掌握度继续使用进度条。
- 当前页面导航高亮更明显。

## Phase 15A 前端检查点

- `/agents-flow` 展示已实现 Agent 的协作链路，不宣称接入 CrewAI / LangGraph。
- `/innovation` 只包装真实已有能力，不把 BKT、情感感知、费曼学习法、多 Agent 辩论写成已实现。
- 首页增加智能体协作与创新亮点入口，但 `/learn` 仍是主入口。
- 顶部导航只保留核心学习入口，架构、亮点、演示、测试和管理入口放在侧边栏。
- `/learn` Hero 展示学生、课程、目标、当前薄弱点状态和平均准确率。
- `/resources`、`/tutor`、`/practice`、`/analytics` 继续减少工程词，优先用学生能理解的状态和诊断表达。

## Phase 15B 前端检查点

- 首页 `/` 应像正式产品入口，主按钮进入 `/learn`。
- `/learn` 应像学生学习首页，能看到今日任务、薄弱点、学习进度和继续学习。
- `/resources` 资源卡片展示中文类型、摘要、引用数量和状态，默认不全选 6 类资源。
- `/tutor`、`/practice`、`/analytics` 弱化技术字段，突出带来源答疑、批改反馈和学习诊断。
- `/agents-flow` 和 `/innovation` 用于比赛讲解，但不虚构未实现能力。
- 页面和文档不得出现真实密钥。

## Phase 16A 前端检查点

- 全局 layout 使用 `components/v2/app-shell.tsx`，采用左侧学生导航和简洁顶部课程栏。
- `/` 应像正式产品首页，主行动进入 `/learn`。
- `/learn` 应像学生学习首页，突出今日任务、继续学习、学习进度、薄弱点和最近结果。
- `/resources` 应像学习资料页面，资源列表不展示 Markdown 原文，详情继续使用 Markdown / Mermaid / CitationList。
- `/agents-flow` 和 `/innovation` 使用 V2 卡片语言，能服务比赛讲解但不虚构未实现能力。
- 导航中 `/learn` 优先，当前页高亮明显，演示、测试和管理入口降级。
