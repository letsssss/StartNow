import { NextRequest, NextResponse } from "next/server";

const CORS_ORIGINS = [
  "http://localhost:8083",
  "http://localhost:19006",
  "http://localhost:19000",
];
const CORS_METHODS = "GET, POST, PUT, PATCH, DELETE, OPTIONS";
const CORS_HEADERS = "Content-Type, Authorization";

function corsHeaders(origin: string | null): Headers {
  const h = new Headers();
  const allowOrigin =
    origin && CORS_ORIGINS.includes(origin) ? origin : CORS_ORIGINS[0];
  h.set("Access-Control-Allow-Origin", allowOrigin);
  h.set("Access-Control-Allow-Methods", CORS_METHODS);
  h.set("Access-Control-Allow-Headers", CORS_HEADERS);
  return h;
}

export function middleware(request: NextRequest) {
  const origin = request.headers.get("origin");

  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders(origin),
    });
  }

  const res = NextResponse.next();
  const h = corsHeaders(origin);
  h.forEach((value, key) => res.headers.set(key, value));
  return res;
}

export const config = {
  matcher: ["/api/:path*"],
};
