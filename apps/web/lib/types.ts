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
