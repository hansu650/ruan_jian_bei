# Phase 16C：导航修复与学生端 UI 壳子重写

## 本阶段目标

Phase 16C 聚焦前端体验中的基础交互问题：学生端左侧导航重复、顶部导航点击不可靠、页面仍像后台控制台。本阶段不新增后端业务功能，不新增 Agent，不修改数据库模型，也不触发真实 Spark 生成。

## 为什么重写学生端 UI 壳子

前一版 UI V2 已经统一了部分卡片和页面视觉，但学生端仍然使用左侧大 sidebar。对于学习产品来说，学生第一次进入更需要看到课程、任务和下一步行动，而不是管理后台式导航。因此本阶段将学生端改为顶部导航 + 居中内容布局。

## 导航点击修复

本阶段新增 `StudentTopNav`，所有学生端导航项都使用 Next.js `Link`：

- 工作台 `/learn`
- 画像 `/profile`
- 路径 `/learning-path`
- 资源 `/resources`
- 辅导 `/tutor`
- 练习 `/practice`
- 评估 `/analytics`

当前页面通过 `usePathname()` 高亮，样式为浅蓝背景、蓝色文字和浅蓝边框。导航项不使用假按钮、不使用空 href，也不通过遮罩层拦截点击。

## Sidebar 重复问题修复

`AppShell` 现在按路由分发：

- 学生端路由使用 `StudentShell`，只渲染顶部导航。
- 演示、测试和管理路由使用 `AdminShell`，保留简化管理入口。

旧 `AppSidebar` 和 V2 `StudentSidebar` 保留为兼容空组件，避免旧引用重新把学生端 sidebar 带回来。

## StudentShell 设计

学生端结构：

```tsx
<div className="min-h-screen bg-slate-50">
  <StudentTopNav />
  {children}
</div>
```

页面内容由各页面自己的居中容器控制，整体保持白底卡片、浅灰背景和大留白。

## AdminShell 设计

`/demo`、`/qa`、`/dashboard`、`/database`、`/courses`、`/students`、`/llm-lab`、`/health` 使用简化管理壳。管理壳不会影响学生端，也不会在学生页面重复出现。

## 核心页面改造

- `/learn`：继续作为学生端主入口，顶部导航下展示学习目标、今日任务、学习进度和薄弱点。
- `/resources`：保留学习资料中心布局，默认不全选 6 类资源，真实模型模式下批量生成仍需确认。
- `/tutor`：调整为左侧对话、右侧上下文/引用来源，更接近 AI 辅导页。
- `/practice`：收窄内容宽度，保持在线小测体验。
- `/analytics`：收窄内容宽度，保持学习诊断报告体验。

## 本阶段没有做

- 没有新增后端业务功能。
- 没有新增 Agent。
- 没有修改数据库模型。
- 没有修改 SparkHTTPProvider 真实调用逻辑。
- 没有触发真实 Spark 生成。
- 没有生成最终 PPT、视频脚本或系统说明书终稿。

## 验收方式

自动检查：

```powershell
.\scripts\check-phase16c.ps1
```

手动检查：

1. 打开 `/learn`，确认只有顶部导航，没有左侧重复导航。
2. 点击顶部导航的工作台、画像、路径、资源、辅导、练习、评估，确认路由变化。
3. 当前页面导航应有浅蓝高亮。
4. 1366px 宽度下不应出现明显横向滚动。
5. `/resources`、`/tutor`、`/practice`、`/analytics` 应保持学生学习产品观感。
6. `/demo` 和 `/qa` 仍可正常打开，但不影响学生端。
7. 页面、接口和日志不显示真实密钥，自动化测试不真实调用 Spark。
