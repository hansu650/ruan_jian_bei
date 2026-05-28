# EduForge Web

Next.js 前端应用，当前处于第七阶段：个性化学习路径 PlannerAgent。

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

## /learning-path 页面

页面支持选择学生和课程，读取已有 LearnerProfile，输入目标学习天数，并调用 `POST /api/learning-paths/generate` 生成阶段化学习路径。页面会展示：

- 学习画像摘要
- 历史学习路径列表
- LearningPath 策略摘要
- LearningPathStep 时间线
- 推荐资源类型
- 薄弱点覆盖检查
- 总预计学习时长

本阶段只推荐资源类型，不生成讲义、思维导图、练习题、实操案例或视频脚本正文。

## 检查

```bash
pnpm lint
pnpm typecheck
```

当前不引入 axios、react-query、复杂状态管理、图表库、认证库或 AI SDK。
