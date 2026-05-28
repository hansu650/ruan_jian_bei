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
  "测验反馈",
  "动态推荐",
];

export const CORE_FEATURES = [
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
    status: "进行中",
    description: "TutorAgent 基于课程知识库引用回答，并通过 CitationVerifier 降低幻觉风险。",
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
  { name: "第九阶段", description: "智能辅导与防幻觉问答 TutorAgent", status: "进行中" },
  { name: "第十阶段", description: "练习批改与学习效果评估", status: "待开始" },
];
