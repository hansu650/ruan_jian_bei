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
    title: "课程资料与知识库基础",
    status: "已完成",
    description: "原创资料、Markdown/TXT 解析、文档分块、入库和关键词检索已经完成。",
  },
  {
    title: "MockLLM 与讯飞接口预留",
    status: "已完成",
    description: "Provider 抽象、MockLLM、SparkProvider 预留、调用日志和模型实验室已经完成。",
  },
  {
    title: "对话式学习画像",
    status: "进行中",
    description: "当前建设 ProfileAgent，通过自然语言对话抽取并更新 8 维动态画像。",
  },
  {
    title: "学习路径与资源生成",
    status: "待开始",
    description: "后续阶段再接入 PlannerAgent、ResourceAgent 和多类型学习资源生成能力。",
  },
];

export const PROJECT_STAGES: Array<{
  name: string;
  description: string;
  status: StageStatus;
}> = [
  { name: "第一阶段", description: "环境准备", status: "已完成" },
  { name: "第二阶段", description: "前端骨架与联调", status: "已完成" },
  { name: "第三阶段", description: "数据库模型与基础 CRUD", status: "已完成" },
  { name: "第四阶段", description: "课程资料与知识库基础", status: "已完成" },
  { name: "第五阶段", description: "MockLLM 与讯飞接口预留", status: "已完成" },
  { name: "第六阶段", description: "对话式学习画像 ProfileAgent", status: "进行中" },
  { name: "第七阶段", description: "个性化学习路径", status: "待开始" },
  { name: "第八阶段", description: "多类型学习资源生成", status: "待开始" },
  { name: "第九阶段", description: "智能辅导", status: "待开始" },
  { name: "第十阶段", description: "测验评估", status: "待开始" },
];
