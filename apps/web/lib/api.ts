import type {
  AgentRun,
  Course,
  CourseCreate,
  CourseDocument,
  DocumentChunk,
  DocumentImportResult,
  DocumentSearchResult,
  GeneratedResource,
  GenerateResourceRequest,
  GenerateResourceResponse,
  GenerateStepResourcesRequest,
  GenerateStepResourcesResponse,
  HealthResponse,
  KnowledgeBaseStats,
  KnowledgePoint,
  KnowledgePointCreate,
  LLMCallLog,
  LLMChatRequest,
  LLMChatResponse,
  LLMGenerateRequest,
  LLMGenerateResponse,
  LLMScenario,
  LLMStatusResponse,
  LearnerProfile,
  GenerateLearningPathRequest,
  GenerateLearningPathResponse,
  LearningPath,
  LearningPathDetailResponse,
  LearningPathPlanCheck,
  LearningPathStep,
  MetaResponse,
  ProfileChatRequest,
  ProfileChatResponse,
  ProfileDimensionCheck,
  ProfileDraft,
  ProfileDraftCreate,
  ProfileSummaryResponse,
  ResourceItem,
  ResourceItemCreate,
  ResourceTypeInfo,
  Student,
  StudentCreate,
} from "@/lib/types";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

export class ApiRequestError extends Error {
  status?: number;
  url: string;

  constructor(message: string, options: { status?: number; url: string }) {
    super(message);
    this.name = "ApiRequestError";
    this.status = options.status;
    this.url = options.url;
  }
}

interface RequestOptions {
  method?: "GET" | "POST";
  body?: unknown;
  timeoutMs?: number;
}

async function requestJson<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), options.timeoutMs ?? 5000);

  try {
    const response = await fetch(url, {
      method: options.method ?? "GET",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      throw new ApiRequestError(`请求失败：HTTP ${response.status}`, {
        status: response.status,
        url,
      });
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ApiRequestError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiRequestError("请求超时，请确认后端服务是否已启动。", { url });
    }

    throw new ApiRequestError("无法连接后端服务，请检查 API 地址和 CORS 配置。", { url });
  } finally {
    globalThis.clearTimeout(timeout);
  }
}

async function requestForm<T>(path: string, formData: FormData): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: { Accept: "application/json" },
      body: formData,
    });

    if (!response.ok) {
      throw new ApiRequestError(`请求失败：HTTP ${response.status}`, {
        status: response.status,
        url,
      });
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ApiRequestError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiRequestError("请求超时，请确认后端服务是否已启动。", { url });
    }

    throw new ApiRequestError("无法连接后端服务，请检查 API 地址和 CORS 配置。", { url });
  } finally {
    globalThis.clearTimeout(timeout);
  }
}

function queryString(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      search.set(key, String(value));
    }
  });
  const text = search.toString();
  return text ? `?${text}` : "";
}

export function getHealth(): Promise<HealthResponse> {
  return requestJson<HealthResponse>("/api/health");
}

export function getMeta(): Promise<MetaResponse> {
  return requestJson<MetaResponse>("/api/meta");
}

export function getStudents(): Promise<Student[]> {
  return requestJson<Student[]>("/api/students");
}

export function createStudent(payload: StudentCreate): Promise<Student> {
  return requestJson<Student>("/api/students", { method: "POST", body: payload });
}

export function getCourses(): Promise<Course[]> {
  return requestJson<Course[]>("/api/courses");
}

export function createCourse(payload: CourseCreate): Promise<Course> {
  return requestJson<Course>("/api/courses", { method: "POST", body: payload });
}

export function getKnowledgePoints(courseId: number): Promise<KnowledgePoint[]> {
  return requestJson<KnowledgePoint[]>(`/api/courses/${courseId}/knowledge-points`);
}

export function createKnowledgePoint(
  courseId: number,
  payload: KnowledgePointCreate,
): Promise<KnowledgePoint> {
  return requestJson<KnowledgePoint>(`/api/courses/${courseId}/knowledge-points`, {
    method: "POST",
    body: payload,
  });
}

export function getProfileDrafts(params?: {
  student_id?: number;
  course_id?: number;
}): Promise<ProfileDraft[]> {
  return requestJson<ProfileDraft[]>(`/api/profile-drafts${queryString(params ?? {})}`);
}

export function createProfileDraft(payload: ProfileDraftCreate): Promise<ProfileDraft> {
  return requestJson<ProfileDraft>("/api/profile-drafts", { method: "POST", body: payload });
}

export function getResourceItems(params?: {
  course_id?: number;
  student_id?: number;
  resource_type?: string;
}): Promise<ResourceItem[]> {
  return requestJson<ResourceItem[]>(`/api/resource-items${queryString(params ?? {})}`);
}

export function createResourceItem(payload: ResourceItemCreate): Promise<ResourceItem> {
  return requestJson<ResourceItem>("/api/resource-items", { method: "POST", body: payload });
}

export function getCourseDocuments(courseId: number): Promise<CourseDocument[]> {
  return requestJson<CourseDocument[]>(`/api/courses/${courseId}/documents`);
}

export function importSampleDocuments(courseId: number): Promise<DocumentImportResult> {
  return requestJson<DocumentImportResult>(`/api/courses/${courseId}/documents/import-sample`, {
    method: "POST",
  });
}

export function uploadCourseDocument(courseId: number, file: File): Promise<CourseDocument> {
  const formData = new FormData();
  formData.set("file", file);
  return requestForm<CourseDocument>(`/api/courses/${courseId}/documents/upload`, formData);
}

export function getDocumentChunks(courseId: number, documentId: number): Promise<DocumentChunk[]> {
  return requestJson<DocumentChunk[]>(`/api/courses/${courseId}/documents/${documentId}/chunks`);
}

export function getKnowledgeBaseStats(courseId: number): Promise<KnowledgeBaseStats> {
  return requestJson<KnowledgeBaseStats>(`/api/courses/${courseId}/knowledge-base/stats`);
}

export function searchKnowledgeBase(
  courseId: number,
  query: string,
  limit = 10,
): Promise<DocumentSearchResult[]> {
  return requestJson<DocumentSearchResult[]>(
    `/api/courses/${courseId}/knowledge-base/search${queryString({ q: query, limit })}`,
  );
}

export function getLLMStatus(): Promise<LLMStatusResponse> {
  return requestJson<LLMStatusResponse>("/api/llm/status");
}

export function getLLMScenarios(): Promise<LLMScenario[]> {
  return requestJson<LLMScenario[]>("/api/llm/scenarios");
}

export function generateLLMText(payload: LLMGenerateRequest): Promise<LLMGenerateResponse> {
  return requestJson<LLMGenerateResponse>("/api/llm/generate", {
    method: "POST",
    body: payload,
  });
}

export function chatLLM(payload: LLMChatRequest): Promise<LLMChatResponse> {
  return requestJson<LLMChatResponse>("/api/llm/chat", {
    method: "POST",
    body: payload,
  });
}

export function getLLMLogs(limit = 50): Promise<LLMCallLog[]> {
  return requestJson<LLMCallLog[]>(`/api/llm/logs${queryString({ limit })}`);
}

export function getLearnerProfiles(params?: {
  student_id?: number;
  course_id?: number;
}): Promise<LearnerProfile[]> {
  return requestJson<LearnerProfile[]>(`/api/learner-profiles${queryString(params ?? {})}`);
}

export function getLearnerProfile(profileId: number): Promise<LearnerProfile> {
  return requestJson<LearnerProfile>(`/api/learner-profiles/${profileId}`);
}

export function chatWithProfileAgent(
  payload: ProfileChatRequest,
): Promise<ProfileChatResponse> {
  return requestJson<ProfileChatResponse>("/api/learner-profiles/chat", {
    method: "POST",
    body: payload,
  });
}

export function getProfileSummary(
  studentId: number,
  courseId: number,
): Promise<ProfileSummaryResponse> {
  return requestJson<ProfileSummaryResponse>(
    `/api/learner-profiles/summary/by-student-course${queryString({
      student_id: studentId,
      course_id: courseId,
    })}`,
  );
}

export function getProfileDimensionCheck(
  studentId: number,
  courseId: number,
): Promise<ProfileDimensionCheck> {
  return requestJson<ProfileDimensionCheck>(
    `/api/learner-profiles/dimension-check/by-student-course${queryString({
      student_id: studentId,
      course_id: courseId,
    })}`,
  );
}

export function getAgentRuns(params?: {
  agent_name?: string;
  student_id?: number;
  course_id?: number;
  limit?: number;
}): Promise<AgentRun[]> {
  return requestJson<AgentRun[]>(`/api/agent-runs${queryString(params ?? {})}`);
}

export function generateLearningPath(
  payload: GenerateLearningPathRequest,
): Promise<GenerateLearningPathResponse> {
  return requestJson<GenerateLearningPathResponse>("/api/learning-paths/generate", {
    method: "POST",
    body: payload,
  });
}

export function getLearningPaths(params?: {
  student_id?: number;
  course_id?: number;
}): Promise<LearningPath[]> {
  return requestJson<LearningPath[]>(`/api/learning-paths${queryString(params ?? {})}`);
}

export function getLearningPath(pathId: number): Promise<LearningPathDetailResponse> {
  return requestJson<LearningPathDetailResponse>(`/api/learning-paths/${pathId}`);
}

export function getLearningPathSteps(pathId: number): Promise<LearningPathStep[]> {
  return requestJson<LearningPathStep[]>(`/api/learning-paths/${pathId}/steps`);
}

export function getLearningPathPlanCheck(pathId: number): Promise<LearningPathPlanCheck> {
  return requestJson<LearningPathPlanCheck>(`/api/learning-paths/${pathId}/plan-check`);
}

export function getGeneratedResourceTypes(): Promise<ResourceTypeInfo[]> {
  return requestJson<ResourceTypeInfo[]>("/api/generated-resources/types");
}

export function generateResource(
  payload: GenerateResourceRequest,
): Promise<GenerateResourceResponse> {
  return requestJson<GenerateResourceResponse>("/api/generated-resources/generate", {
    method: "POST",
    body: payload,
  });
}

export function generateResourcesForStep(
  payload: GenerateStepResourcesRequest,
): Promise<GenerateStepResourcesResponse> {
  return requestJson<GenerateStepResourcesResponse>("/api/generated-resources/generate-for-step", {
    method: "POST",
    body: payload,
  });
}

export function getGeneratedResources(params?: {
  student_id?: number;
  course_id?: number;
  path_id?: number;
  step_id?: number;
  resource_type?: string;
}): Promise<GeneratedResource[]> {
  return requestJson<GeneratedResource[]>(`/api/generated-resources${queryString(params ?? {})}`);
}

export function getGeneratedResource(resourceId: number): Promise<GeneratedResource> {
  return requestJson<GeneratedResource>(`/api/generated-resources/${resourceId}`);
}
