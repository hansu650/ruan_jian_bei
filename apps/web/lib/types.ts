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

export interface Student {
  id: number;
  name: string;
  major: string;
  grade_level: string;
  email?: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudentCreate {
  name: string;
  major: string;
  grade_level: string;
  email?: string | null;
}

export interface Course {
  id: number;
  title: string;
  description: string;
  subject: string;
  semester?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CourseCreate {
  title: string;
  description: string;
  subject: string;
  semester?: string | null;
}

export interface KnowledgePoint {
  id: number;
  course_id: number;
  title: string;
  chapter: string;
  order_index: number;
  summary: string;
  difficulty: string;
  prerequisites_json: string;
  created_at: string;
  updated_at: string;
}

export interface KnowledgePointCreate {
  title: string;
  chapter: string;
  order_index: number;
  summary: string;
  difficulty: string;
  prerequisites_json?: string;
}

export interface ProfileDraft {
  id: number;
  student_id: number;
  course_id: number;
  goal: string;
  background: string;
  weak_points_json: string;
  preferences_json: string;
  mastery_json: string;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileDraftCreate {
  student_id: number;
  course_id: number;
  goal: string;
  background: string;
  weak_points_json?: string;
  preferences_json?: string;
  mastery_json?: string;
  notes?: string | null;
}

export interface ResourceItem {
  id: number;
  course_id: number;
  knowledge_point_id?: number | null;
  student_id?: number | null;
  resource_type: string;
  title: string;
  status: string;
  content_preview?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ResourceItemCreate {
  course_id: number;
  knowledge_point_id?: number | null;
  student_id?: number | null;
  resource_type: string;
  title: string;
  status?: string;
  content_preview?: string | null;
}

export interface CourseDocument {
  id: number;
  course_id: number;
  filename: string;
  original_filename: string;
  file_type: string;
  source_type: string;
  status: string;
  chunk_count: number;
  error_message?: string | null;
  content_hash?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentChunk {
  id: number;
  document_id: number;
  course_id: number;
  chunk_index: number;
  section_title?: string | null;
  content: string;
  char_count: number;
  content_hash: string;
  metadata_json: string;
  created_at: string;
}

export interface DocumentImportResult {
  imported_documents: number;
  indexed_documents: number;
  created_chunks: number;
  skipped_documents: number;
  message: string;
}

export interface DocumentSearchResult {
  document_id: number;
  filename: string;
  chunk_id: number;
  chunk_index: number;
  section_title?: string | null;
  content: string;
  score: number;
  metadata_json: string;
}

export interface KnowledgeBaseStats {
  course_id: number;
  document_count: number;
  chunk_count: number;
  indexed_document_count: number;
}

export interface LLMStatusResponse {
  provider: string;
  model: string;
  use_mock_llm: boolean;
  effective_provider: string;
  spark_configured: boolean;
  status: string;
  warning?: string | null;
}

export interface LLMScenario {
  key: string;
  title: string;
  description: string;
  sample_prompt: string;
}

export interface LLMMessage {
  role: string;
  content: string;
}

export interface LLMGenerateRequest {
  prompt: string;
  system_prompt?: string | null;
  scenario?: string;
  temperature?: number;
}

export interface LLMGenerateResponse {
  content: string;
  provider: string;
  model: string;
  scenario: string;
  used_mock: boolean;
  latency_ms: number;
  log_id?: number | null;
}

export interface LLMChatRequest {
  messages: LLMMessage[];
  scenario?: string;
  temperature?: number;
}

export interface LLMChatResponse {
  content: string;
  provider: string;
  model: string;
  scenario: string;
  used_mock: boolean;
  latency_ms: number;
  log_id?: number | null;
}

export interface LLMCallLog {
  id: number;
  provider: string;
  model: string;
  scenario: string;
  prompt_preview: string;
  response_preview?: string | null;
  status: string;
  error_message?: string | null;
  latency_ms?: number | null;
  created_at: string;
}

export interface LearnerProfile {
  id: number;
  student_id: number;
  course_id: number;
  major: string;
  learning_goal: string;
  knowledge_base: string;
  learning_preference_json: string;
  cognitive_style: string;
  weak_points_json: string;
  time_constraint: string;
  mastery_json: string;
  profile_summary: string;
  version: number;
  source: string;
  created_at: string;
  updated_at: string;
}

export interface ProfileChatMessage {
  id: number;
  student_id: number;
  course_id: number;
  profile_id?: number | null;
  role: "user" | "assistant" | "system" | string;
  content: string;
  created_at: string;
}

export interface ProfileChatRequest {
  student_id: number;
  course_id: number;
  message: string;
}

export interface ProfileChatResponse {
  profile: LearnerProfile;
  assistant_message: string;
  extracted_updates: Record<string, unknown>;
  is_created: boolean;
  agent_run_id?: number | null;
  llm_log_id?: number | null;
}

export interface ProfileSummaryResponse {
  profile?: LearnerProfile | null;
  messages: ProfileChatMessage[];
}

export interface ProfileDimensionCheck {
  required_dimensions: string[];
  completed_dimensions: string[];
  missing_dimensions: string[];
  completion_rate: number;
}

export interface AgentRun {
  id: number;
  agent_name: string;
  student_id?: number | null;
  course_id?: number | null;
  input_preview: string;
  output_preview?: string | null;
  status: string;
  error_message?: string | null;
  latency_ms?: number | null;
  llm_log_id?: number | null;
  created_at: string;
}

export interface LearningPath {
  id: number;
  student_id: number;
  course_id: number;
  profile_id?: number | null;
  title: string;
  goal: string;
  target_days: number;
  status: string;
  strategy_summary: string;
  weak_points_json: string;
  recommended_resource_types_json: string;
  version: number;
  source: string;
  created_at: string;
  updated_at: string;
}

export interface LearningPathStep {
  id: number;
  path_id: number;
  course_id: number;
  order_index: number;
  title: string;
  objective: string;
  knowledge_points_json: string;
  prerequisite: string;
  estimated_minutes: number;
  recommended_resource_types_json: string;
  recommended_activity: string;
  mastery_threshold: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface GenerateLearningPathRequest {
  student_id: number;
  course_id: number;
  profile_id?: number | null;
  target_days?: number;
  regenerate?: boolean;
}

export interface LearningPathDetailResponse {
  path: LearningPath;
  steps: LearningPathStep[];
}

export interface GenerateLearningPathResponse extends LearningPathDetailResponse {
  agent_run_id?: number | null;
  llm_log_id?: number | null;
  generation_summary: string;
}

export interface LearningPathPlanCheck {
  required_step_count: number;
  actual_step_count: number;
  has_weak_point_coverage: boolean;
  covered_weak_points: string[];
  missing_weak_points: string[];
  total_estimated_minutes: number;
  recommended_resource_types: string[];
}
