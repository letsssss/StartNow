import type { StructuredOutput } from "../domain/structured";

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
  const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

  if (__DEV__) {
    console.log("[apiClient] EXPO_PUBLIC_API_BASE_URL =", process.env.EXPO_PUBLIC_API_BASE_URL);
    if (!BASE_URL) {
      console.warn("[apiClient] EXPO_PUBLIC_API_BASE_URL이 없습니다. mobile/.env에 EXPO_PUBLIC_API_BASE_URL=http://PC_IP:3000 형태로 설정 후 'npx expo start -c' 로 재시작하세요.");
    }
  }

  if (!BASE_URL) {
    throw new Error("EXPO_PUBLIC_API_BASE_URL is not set. Set it in .env and restart with: npx expo start -c");
  }

  const API_URL = `${BASE_URL}/api/structure`;

  if (__DEV__) {
    console.log("[apiClient] 요청 URL:", API_URL);
  }

  let res: Response;
  try {
    res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
  } catch (e) {
    if (__DEV__) {
      const message = e instanceof Error ? e.message : String(e);
      console.warn("[apiClient] fetch 실패:", {
        message,
        url: API_URL,
        BASE_URL,
        endpoint: "/api/structure",
        hint: "서버 미실행, .env 미적용(재시작 필요), 같은 WiFi, 백엔드 3000/3001, 방화벽 인바운드 확인",
      });
    }
    throw e;
  }

  if (__DEV__) {
    console.log("[apiClient] 응답 status:", res.status);
  }

  const json = (await res.json()) as StructuredOutput | StructureError;

  if (!res.ok) {
    if (__DEV__) {
      console.warn("[apiClient] 응답 실패 status:", res.status, "body:", json);
    }
    const err = (json as StructureError).error;
    return { ok: false, error: err ?? { code: "UNKNOWN", message: res.statusText } };
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
