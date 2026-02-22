export const CORS_ORIGINS: string[] = [
  "http://localhost:8081",
  "http://localhost:8083",
  "http://localhost:19006",
  "http://192.168.0.2:8081",
  "http://192.168.0.2:8083",
];

const CORS_METHODS = "GET, POST, PUT, PATCH, DELETE, OPTIONS";
const CORS_HEADERS = "Content-Type, Authorization";

export function corsHeaders(origin: string | null): Record<string, string> {
  const h: Record<string, string> = {
    "Access-Control-Allow-Methods": CORS_METHODS,
    "Access-Control-Allow-Headers": CORS_HEADERS,
    "Access-Control-Allow-Credentials": "true",
  };
  if (origin && CORS_ORIGINS.includes(origin)) {
    h["Access-Control-Allow-Origin"] = origin;
  }
  return h;
}

export function withCors(response: Response, request: Request): Response {
  const origin = request.headers.get("origin");
  const h = corsHeaders(origin);
  const newResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
  Object.entries(h).forEach(([k, v]) => newResponse.headers.set(k, v));
  return newResponse;
}
