import type { HealthResponse, MetaResponse } from "@/lib/types";

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

async function requestJson<T>(path: string, timeoutMs = 5000): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
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
    window.clearTimeout(timeout);
  }
}

export function getHealth(): Promise<HealthResponse> {
  return requestJson<HealthResponse>("/api/health");
}

export function getMeta(): Promise<MetaResponse> {
  return requestJson<MetaResponse>("/api/meta");
}
