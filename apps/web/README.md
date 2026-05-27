# EduForge Web

EduForge 智学工坊前端应用，第二阶段用于完成 Next.js 骨架、比赛演示首页、Dashboard 骨架页和前后端 health check 联调。

## 技术栈

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui 基础组件
- pnpm

## 环境要求

- Node.js >= 20.9
- pnpm

如果 pnpm 未安装：

```bash
corepack enable
corepack prepare pnpm@latest --activate
```

## 安装依赖

```bash
cd apps/web
pnpm install
```

## 启动开发服务

```bash
cd apps/web
pnpm dev
```

默认访问：

- 首页：[http://localhost:3000](http://localhost:3000)
- Dashboard：[http://localhost:3000/dashboard](http://localhost:3000/dashboard)
- Health 页面：[http://localhost:3000/health](http://localhost:3000/health)

## 前后端联调

前端通过 `NEXT_PUBLIC_API_BASE_URL` 直接访问后端，默认值为：

```bash
http://localhost:8000
```

本目录提供 `.env.example`：

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

后端未启动时页面会显示错误提示，不会白屏。

## 检查命令

```bash
pnpm lint
pnpm typecheck
pnpm build
```

## 当前阶段范围

第二阶段只实现前端骨架和前后端联调，不实现登录、数据库、学习画像、多智能体、RAG、资源生成、测验评估或真实大模型 API。
