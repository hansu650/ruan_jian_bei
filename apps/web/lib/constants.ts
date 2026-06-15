export const APP_NAME = "EduForge 智学工坊";
export const APP_SUBTITLE = "基于大模型的个性化资源生成与学习多智能体系统";
export const COMPETITION_NAME = "第十五届中国软件杯";
export const COMPETITION_TRACK = "A3";
export const COMPANY_NAME = "科大讯飞股份有限公司";
export const PROJECT_POSITIONING = "面向高校课程学习场景的 AI 个性化学习资源工厂";

export const CORE_LOOP = [
  "对话画像",
  "知识库检索",
  "多智能体协作",
  "学习路径",
  "资源生成",
  "智能辅导",
  "练习测验",
  "自动批改",
  "掌握度更新",
  "动态推荐",
];

export const CORE_FEATURES = [
  {
    title: "学生端学习工作台",
    status: "已完成",
    description: "将学习画像、路径、资源、练习和评估组织成学生能直接理解的学习旅程。",
  },
  {
    title: "多智能体协作呈现",
    status: "已完成",
    description: "用架构视图解释 ProfileAgent、PlannerAgent、ResourceAgent、TutorAgent、PracticeAgent 和 EvaluatorAgent 的协作链路。",
  },
  {
    title: "创新亮点包装",
    status: "已完成",
    description: "将画像驱动闭环、可信知识库、引用防幻觉、轻量掌握度追踪等真实能力整理成评委易懂的亮点。",
  },
  {
    title: "全局学习产品视觉升级",
    status: "已完成",
    description: "收敛首页、学习工作台、资源、辅导、练习和评估页面，让系统更像正式学习平台而不是后台控制台。",
  },
  {
    title: "UI V2 学生端外壳",
    status: "已完成",
    description: "重写全局 app shell、左侧学生导航、顶部课程栏和核心学习页面布局，形成成熟学习产品的第一印象。",
  },
  {
    title: "学生端顶部导航壳",
    status: "进行中",
    description: "学生端切换为顶部导航与居中内容布局，修复导航跳转和左侧导航重复问题。",
  },
  {
    title: "演示与测试辅助",
    status: "已完成",
    description: "演示工作台和测试清单保留为答辩前检查工具，不再作为学生主入口。",
  },
  {
    title: "演示工作台",
    status: "已完成",
    description: "端到端演示检查入口，比赛前可快速确认各模块状态。",
  },
  {
    title: "对话式学习画像",
    status: "已完成",
    description: "ProfileAgent 支持自然语言对话抽取并更新 8 维动态画像。",
  },
  {
    title: "个性化学习路径",
    status: "已完成",
    description: "PlannerAgent 根据画像和课程知识点生成阶段化学习计划。",
  },
  {
    title: "多类型学习资源生成",
    status: "已完成",
    description: "ResourceAgent 生成讲义、思维导图、练习题、阅读、实操案例和视频脚本。",
  },
  {
    title: "智能辅导与防幻觉",
    status: "已完成",
    description: "TutorAgent 基于课程知识库引用回答，并通过 CitationVerifier 降低幻觉风险。",
  },
  {
    title: "学习效果评估",
    status: "已完成",
    description: "PracticeAgent 与 EvaluatorAgent 支持练习生成、自动批改、掌握度更新和补救建议。",
  },
];

export const PROJECT_STAGES: Array<{
  name: string;
  description: string;
  status: string;
}> = [
  { name: "第一阶段", description: "环境准备", status: "已完成" },
  { name: "第二阶段", description: "前端骨架与联调", status: "已完成" },
  { name: "第三阶段", description: "数据库模型与基础 CRUD", status: "已完成" },
  { name: "第四阶段", description: "课程资料与知识库基础", status: "已完成" },
  { name: "第五阶段", description: "MockLLM 与讯飞接口预留", status: "已完成" },
  { name: "第六阶段", description: "对话式学习画像 ProfileAgent", status: "已完成" },
  { name: "第七阶段", description: "个性化学习路径 PlannerAgent", status: "已完成" },
  { name: "第八阶段", description: "多类型学习资源生成 ResourceAgent", status: "已完成" },
  { name: "第九阶段", description: "TutorAgent 智能辅导与防幻觉问答", status: "已完成" },
  { name: "第十阶段", description: "PracticeAgent + EvaluatorAgent 学习效果评估", status: "已完成" },
  { name: "Phase 10.1", description: "讯飞星火 HTTP Provider 可选接入", status: "已完成" },
  { name: "Phase 11", description: "端到端演示工作台与稳定性打磨", status: "已完成" },
  { name: "Phase 12", description: "前端体验打磨与人工测试清单", status: "已完成" },
  { name: "Phase 13", description: "端到端彩排与缺陷修复", status: "已完成" },
  { name: "Phase 14A", description: "学生端 UI 修复与内容渲染", status: "已完成" },
  { name: "Phase 14B", description: "学生端体验修补与资源展示修复", status: "已完成" },
  { name: "Phase 15A", description: "学生端 UI 升级与创新点包装", status: "已完成" },
  { name: "Phase 15B", description: "全局 UI 重构与学习产品视觉升级", status: "已完成" },
  { name: "Phase 16A", description: "全站 UI V2 大重构", status: "已完成" },
  { name: "Phase 16C", description: "导航点击修复与学生端极简 UI 壳重写", status: "进行中" },
];
