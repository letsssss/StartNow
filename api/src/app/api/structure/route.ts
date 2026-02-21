import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ ok: true });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const text = typeof body?.text === "string" ? body.text : "";

    const lines = text
      .split("\n")
      .map((l: string) => l.trim())
      .filter(Boolean);

    const actions = lines.length
      ? lines.map((line) => ({ label: line, minutes: 15 }))
      : [{ label: "할 일", minutes: 15 }];

    const firstLabel = actions[0].label;

    const data = {
      title: text.slice(0, 50).trim() || firstLabel || "제목",
      goals: [] as string[],
      branches: [] as string[],
      blockers: [] as string[],
      actions,
      pickNow: {
        label: firstLabel,
        minutes: 15,
        reason: "입력된 첫 번째 할 일",
      },
      workflowReason:
        lines.length > 0
          ? "입력 내용을 줄 단위로 반영했습니다."
          : "API 라우트 동작 확인용",
    };

    return NextResponse.json(data);
  } catch (e) {
    console.error("[api/structure]", e);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: String(e) } },
      { status: 500 }
    );
  }
}
