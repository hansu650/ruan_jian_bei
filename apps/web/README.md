# EduForge Web

Next.js 前端应用，当前处于第五阶段：MockLLM 与讯飞接口预留。

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
- `/knowledge-base`：课程资料导入、上传、分块、检索演示
- `/llm-lab`：MockLLM、场景提示词和调用日志测试

## 模型实验室

`/llm-lab` 支持：

- 查看 provider 状态
- 查看场景列表
- Generate 测试
- Chat 测试
- 查看最近 LLM 调用日志

页面说明当前只使用 Mock 模型和 SparkProvider 预留，不代表已实现学习画像、Agent 或资源生成。当前不调用真实外部 API，不需要 API Key，不产生费用。

## 检查

```bash
pnpm lint
pnpm typecheck
```

当前不引入 axios、react-query、复杂状态管理、图表库、认证库或 AI SDK。
