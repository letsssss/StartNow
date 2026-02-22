import { NextResponse } from "next/server";
import { corsHeaders } from "@/infra/cors";

export async function GET(request: Request) {
  const origin = request.headers.get("origin");
  const res = NextResponse.json({ status: "ok" });
  Object.entries(corsHeaders(origin)).forEach(([k, v]) => res.headers.set(k, v));
  return res;
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get("origin");
  const res = new NextResponse(null, { status: 204 });
  Object.entries(corsHeaders(origin)).forEach(([k, v]) => res.headers.set(k, v));
  return res;
}
