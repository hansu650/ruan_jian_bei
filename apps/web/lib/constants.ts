import type { StageStatus } from "@/lib/types";

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
  "测验反馈",
  "动态推荐",
];

export const CORE_FEATURES = [
  {
    title: "学习画像",
    status: "待实现",
    description: "后续通过自然语言对话抽取 8 维学生画像。",
  },
  {
    title: "个性化学习路径",
    status: "待实现",
    description: "后续根据画像、课程进度和薄弱点生成学习步骤。",
  },
  {
    title: "资源生成",
    status: "待实现",
    description: "后续生成讲义、思维导图、练习题和实操案例等资源。",
  },
  {
    title: "智能辅导",
    status: "待实现",
    description: "后续基于课程知识库提供可追溯答疑。",
  },
  {
    title: "学习效果评估",
    status: "待实现",
    description: "后续跟踪练习反馈并更新掌握度。",
  },
];

export const PROJECT_STAGES: Array<{
  name: string;
  description: string;
  status: StageStatus;
}> = [
  { name: "第一阶段", description: "环境准备", status: "已完成" },
  { name: "第二阶段", description: "前端骨架与联调", status: "进行中" },
  { name: "第三阶段", description: "数据库模型", status: "待开始" },
  { name: "第四阶段", description: "课程知识库", status: "待开始" },
  { name: "第五阶段", description: "LLM Provider", status: "待开始" },
  { name: "第六阶段", description: "学习画像", status: "待开始" },
  { name: "第七阶段", description: "学习路径", status: "待开始" },
  { name: "第八阶段", description: "资源生成", status: "待开始" },
  { name: "第九阶段", description: "智能辅导", status: "待开始" },
  { name: "第十阶段", description: "测验评估", status: "待开始" },
];
