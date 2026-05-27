import type {
  Course,
  CourseCreate,
  HealthResponse,
  KnowledgePoint,
  KnowledgePointCreate,
  MetaResponse,
  ProfileDraft,
  ProfileDraftCreate,
  ResourceItem,
  ResourceItemCreate,
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
