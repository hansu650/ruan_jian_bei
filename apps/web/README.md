# EduForge Web

Next.js + TypeScript + Tailwind CSS 前端。当前新增第十阶段页面：

- `/practice`：练习测验，生成题目、填写答案、提交自动批改。
- `/analytics`：学习效果评估，展示测验次数、平均准确率、掌握度和评估报告。

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

- `/profile`：对话式学习画像
- `/learning-path`：个性化学习路径
- `/resources`：多类型资源生成
- `/tutor`：智能辅导与引用校验
- `/practice`：练习测验
- `/analytics`：学习效果评估

前端不使用 axios、react-query、复杂状态管理或图表库；表单和答题状态使用 React `useState`。
