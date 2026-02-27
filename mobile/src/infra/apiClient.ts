import type { StructuredOutput } from "../domain/structured";
import { getApiBaseUrlOrThrow } from "../config/api";

export type StructureError = {
  error: {
    code: string;
    issues?: unknown;
    attempts?: number;
    message?: string;
  };
};

export async function structureText(
  text: string
): Promise<{ ok: true; data: StructuredOutput } | { ok: false; error: StructureError["error"] }> {
  let BASE_URL: string;
  try {
    BASE_URL = getApiBaseUrlOrThrow();
  } catch (e) {
    console.error("[apiClient] BASE_URL is undefined");
    throw e;
  }

  if (__DEV__) {
    console.log("[apiClient] 요청 BASE_URL:", BASE_URL);
  }

  const API_URL = `${BASE_URL}/api/structure`;

  let res: Response;
  try {
    res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    console.error("[apiClient] fetch 실패", {
      message: err.message,
      name: err.name,
      BASE_URL,
      API_URL,
      endpoint: "/api/structure",
    });
    const msg = `[structureText] FETCH_FAILED | url=${API_URL} | method=POST | msg=${err.message}`;
    throw new Error(msg);
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (__DEV__) {
    console.log("[apiClient] res.status:", res.status, "res.ok:", res.ok, "content-type:", contentType);
  }

  if (!res.ok) {
    const bodyText = await res.text();
    const snippet = bodyText.slice(0, 300);
    console.error("[apiClient] HTTP error", { status: res.status, body: snippet });
    throw new Error(
      `[structureText] HTTP ${res.status} ${res.statusText} | url=${API_URL} | ct=${contentType} | body=${snippet}`
    );
  }

  let json: StructuredOutput | StructureError;
  try {
    json = (await res.json()) as StructuredOutput | StructureError;
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    console.error("[apiClient] JSON parse failed", err.message);
    throw new Error(`[apiClient] JSON parse failed: ${err.message}`);
  }

  const data = json as StructuredOutput;
  if (
    !data ||
    typeof data.title !== "string" ||
    !data.pickNow ||
    typeof data.pickNow.label !== "string" ||
    typeof data.pickNow.reason !== "string" ||
    typeof data.workflowReason !== "string"
  ) {
    return { ok: false, error: { code: "INVALID_RESPONSE", message: "응답 형식 오류" } };
  }

  return { ok: true, data };
}
