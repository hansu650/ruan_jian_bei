export interface HealthResponse {
  status: string;
  service: string;
  project: string;
  competition: string;
  stage: string;
}

export interface MetaResponse {
  app_name: string;
  display_name: string;
  competition_name: string;
  competition_track: string;
  competition_topic: string;
  project_positioning: string;
  core_loop: string[];
  implemented_features: string[];
  planned_features: string[];
}

export interface ApiError {
  message: string;
  status?: number;
  url?: string;
}

export type StageStatus = "已完成" | "进行中" | "待开始";
