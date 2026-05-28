# EduForge Web

Next.js + TypeScript + Tailwind CSS 前端。当前处于第九阶段，新增 `/tutor` 智能辅导页面。

## 启动

```powershell
cd apps/web
pnpm install
pnpm dev
```

## 页面

- `/` 首页
- `/dashboard` 阶段仪表盘
- `/health` 前后端联调
- `/knowledge-base` 课程知识库
- `/profile` 对话式学习画像
- `/learning-path` 个性化学习路径
- `/resources` 多类型学习资源生成
- `/tutor` 智能辅导与引用校验

## /tutor 页面能力

- 选择学生和课程
- 展示学习画像摘要
- 可选关联 learning path step
- 可选关联已生成资源
- 通过快捷问题或输入框提问
- 展示 TutorAgent 回答
- 展示 citations、safety_status、verifier_summary
- 查看 TutorMessage 质量检查

当前页面不做答题提交、自动批改或学习效果评估。
