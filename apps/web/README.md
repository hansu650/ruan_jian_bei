# EduForge Web

Next.js 前端应用，当前处于第四阶段：课程资料与知识库基础。

## 技术栈

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui 基础组件
- pnpm

## 安装

```bash
corepack enable
corepack prepare pnpm@latest --activate
pnpm install
```

## 启动

```bash
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

## 第四阶段知识库页面

`/knowledge-base` 支持：

- 选择《数据库系统》课程
- 查看知识库统计
- 导入原创示例课程资料
- 上传 `.md` / `.txt`
- 查看文档列表
- 查看文档 chunks
- 搜索“幻读”“B+树”“JOIN”

页面直接通过 `NEXT_PUBLIC_API_BASE_URL` 请求 FastAPI 后端，不使用 Next.js API route 转发。

## 检查

```bash
pnpm lint
pnpm typecheck
```

当前不引入 axios、react-query、复杂状态管理、图表库、认证库或 AI SDK。
