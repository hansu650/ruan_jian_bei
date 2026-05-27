# EduForge Web

EduForge 智学工坊前端应用。第三阶段新增数据底座页面，用于展示 SQLite + SQLModel seed 数据和最小 CRUD 联调效果。

## 技术栈

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui 基础组件
- pnpm

## 安装依赖

```bash
cd apps/web
pnpm install
```

## 启动

```bash
pnpm dev
```

默认访问：

- 首页：[http://localhost:3000](http://localhost:3000)
- Dashboard：[http://localhost:3000/dashboard](http://localhost:3000/dashboard)
- Health：[http://localhost:3000/health](http://localhost:3000/health)
- 数据底座：[http://localhost:3000/database](http://localhost:3000/database)
- 课程管理：[http://localhost:3000/courses](http://localhost:3000/courses)
- 学生管理：[http://localhost:3000/students](http://localhost:3000/students)

## 前后端联调

前端通过 `NEXT_PUBLIC_API_BASE_URL` 直接访问后端，默认值为：

```bash
http://localhost:8000
```

后端未启动时页面会显示错误提示，不会白屏。

## 检查

```bash
pnpm lint
pnpm typecheck
pnpm build
```

## 当前阶段范围

第三阶段只展示数据底座和基础 CRUD，不实现登录、RAG、LLM、Agent、学习画像生成、资源生成、测验评估或图表分析。
