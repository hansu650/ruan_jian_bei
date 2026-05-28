# EduForge Web

Next.js 前端应用，当前处于第八阶段：多类型学习资源生成 ResourceAgent。

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
- `/dashboard`：阶段进度与功能入口
- `/health`：前后端联调状态
- `/database`：SQLite 数据底座
- `/courses`：课程与知识点管理
- `/students`：学生与画像草稿
- `/knowledge-base`：课程资料导入、上传、分块和检索
- `/llm-lab`：MockLLM、场景提示词和调用日志测试
- `/profile`：ProfileAgent 对话式学习画像
- `/learning-path`：PlannerAgent 个性化学习路径
- `/resources`：ResourceAgent 多类型学习资源生成

## /resources 页面

页面支持选择学生、课程、学习路径和路径步骤，选择资源类型后生成资源正文。当前支持：

- 讲义
- 思维导图
- 练习题
- 拓展阅读
- 实操案例
- 视频脚本

页面会展示资源正文、citations 引用来源和最近 ResourceAgent 运行记录。

## 检查

```bash
pnpm lint
pnpm typecheck
```

当前不引入 axios、react-query、复杂状态管理、图表库、认证库或 AI SDK。
