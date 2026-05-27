# EduForge Web

EduForge 智学工坊前端目录。

## 当前阶段

第一阶段暂不创建正式前端项目，不运行 `create-next-app`，不生成 `package.json`，也不安装前端依赖。这样可以先把后端环境、项目结构和团队规范稳定下来，避免过早引入前端构建复杂度。

## 后续技术栈

第二阶段计划使用：

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui

## Node.js 要求

Node.js 版本要求：

```bash
node >= 20.9
```

推荐使用 Node.js LTS。

## pnpm

后续前端使用 pnpm 作为包管理器。如果 pnpm 未安装，建议执行：

```bash
corepack enable
corepack prepare pnpm@latest --activate
```

## 第二阶段计划

第二阶段将创建正式前端骨架，并接入后端 health check。

## 后续页面规划

- 首页
- Dashboard
- 课程管理
- 学习画像
- 学习路径
- 资源生成
- 智能辅导
- 测验评估
- 学习分析
