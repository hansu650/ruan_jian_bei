# Phase 14A 学生端 UI 修复与内容渲染

## 1. 本阶段目标

Phase 14A 聚焦学生端体验修复，不新增 Agent、不新增数据模型、不接入新的真实外部 API。目标是让 EduForge 从“功能演示后台”进一步转向“学生可以直接使用的学习平台”：

- 修复 Markdown 和 Mermaid 内容以源码形式展示的问题。
- 修复当前页面导航缺少高亮的问题。
- 强化 `/learn` 学生学习工作台。
- 让资源、辅导、练习和评估页面更像学习产品，而不是工程调试页。

## 2. 为什么要补学生端学习首页

A3 赛题关注的是个性化学习闭环。评委或学生第一次进入系统时，需要先理解：

- 当前课程是什么。
- 我的学习目标是什么。
- 今天该学什么。
- 下一步应该点哪里。
- 学习数据是否已经保存，能不能继续学习。

因此 `/learn` 被定义为学生端主入口，聚合学习画像、学习路径、资源、测验和评估结果，而 `/demo` 与 `/qa` 继续作为演示和测试辅助页。

## 3. Markdown / Mermaid 渲染问题

资源生成结果中包含讲义、SQL 实操案例、练习题和 Mermaid 思维导图。如果直接显示 Markdown 源码，会让页面显得像半成品。

本阶段升级：

- `components/markdown-preview.tsx`：使用 `react-markdown` 和 `remark-gfm` 渲染标题、列表、表格、引用和代码块。
- `components/mermaid-diagram.tsx`：识别 `mermaid` 代码块并在客户端渲染成图。
- Mermaid 使用 `securityLevel: "strict"`，渲染失败时回退显示源码并给出提示。
- SQL 和普通代码块使用轻量代码块样式，不引入大型语法高亮依赖。

## 4. 导航高亮修复

顶部导航和侧边导航使用当前 route 判断 active 状态：

- 当前页面使用浅蓝背景、蓝色文字和同步图标色。
- 子路径会继承父级导航高亮。
- 顶部导航只保留学生学习主流程和知识库，减少横向拥挤。
- 演示、测试、数据和模型实验室等入口在侧边导航中降级显示。

## 5. 学生数据持久化表达

学生个性化数据来自后端数据库，而不是前端临时状态。前端通过 API 读取：

- Student
- LearnerProfile
- LearningPath / LearningPathStep
- GeneratedResource
- PracticeAttempt
- LearningEvaluationReport

`/learn` 会展示学生、课程、画像更新时间、路径步骤、资源数量、测验次数和准确率，让学生感受到“我的学习进度已保存，可继续学习”。

## 6. UI 风格收敛

本阶段继续收敛为学习平台风格：

- 白底和浅灰背景为主。
- 主色使用低噪音蓝色。
- 卡片使用细边框和轻阴影。
- 学习页面减少 Phase、Mock、AgentRun 等工程词。
- 状态展示改为中文标签，例如“有来源”“需确认”“不适合处理”。

## 7. 本阶段没有新增

- 没有新增 Agent。
- 没有新增数据库模型。
- 没有新增真实 API 类型。
- 没有生成 PPT、视频脚本或最终说明书。
- 没有 Docker、登录或权限系统。

## 8. 验收方式

前端检查：

```powershell
cd apps/web
pnpm lint
pnpm typecheck
```

完整检查：

```powershell
python scripts/check-env.py
.\scripts\check-phase14a.ps1
```

人工检查重点：

1. `/resources` 的讲义和实操案例以 Markdown 排版展示。
2. `/resources` 的思维导图渲染为 Mermaid 图。
3. SQL 代码块清晰可读。
4. citations 来源展示清楚。
5. 当前页面导航有明显高亮。
6. 1366px 宽度下顶部导航没有明显横向滚动条。
7. `/learn` 像学生学习首页，而不是项目后台。
8. 学习页面不把 Phase 或 Mock 作为主文案。
9. 没有真实密钥出现在页面、代码、日志或文档中。
