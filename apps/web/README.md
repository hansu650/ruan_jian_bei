# EduForge Web

Next.js 前端应用，当前处于第六阶段：对话式学习画像 ProfileAgent。

## 技术栈

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui 基础组件
- pnpm

## 启动

```bash
pnpm install
pnpm dev
```

默认访问 [http://localhost:3000](http://localhost:3000)。

## 页面

- `/`：项目首页
- `/dashboard`：阶段进度与入口
- `/health`：前后端联调状态
- `/database`：SQLite 数据底座
- `/courses`：课程与知识点管理
- `/students`：学生与画像草稿
- `/knowledge-base`：课程资料导入、上传、分块和检索
- `/llm-lab`：MockLLM、场景提示词和调用日志测试
- `/profile`：ProfileAgent 对话式学习画像

## /profile 页面

页面支持选择学生和课程、发送自然语言画像描述、展示画像对话、8 维画像卡片、掌握度进度条、画像完成度和最近 ProfileAgent 运行记录。

当前页面只使用 MockLLM，不调用真实外部 API，不需要 API Key，不产生费用。

## 检查

```bash
pnpm lint
pnpm typecheck
```

当前不引入 axios、react-query、复杂状态管理、图表库、认证库或 AI SDK。
