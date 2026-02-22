import { NextResponse } from "next/server";
import {
  parseActionsFromText,
  estimateMinutesFromLabel,
  type ActionFromAI,
  type ParseActionsResult,
} from "@/infra/parseActionsFromText";

/**
 * route.ts 변경 요약:
 * - parseActionsFromText 호출 추가 (raw 입력 → AI 분해). 줄 split 제거.
 * - orderActionsByRule 추가: 대기/동시진행 → 생리/마감 → 나머지 순서.
 * - 응답은 기존 StructuredOutput 형태 유지 (actions, pickNow, workflowReason).
 */

export const dynamic = "force-dynamic";

const PARALLEL_KEYWORDS = /세탁|돌리기|빨래|세탁기|건조|탈수/;
const PHYSIOLOGICAL_KEYWORDS = /밥|먹기|약|화장실|샤워|머리\s*말리|양치|세수/;

function orderActionsByRule(actions: ActionFromAI[]): ActionFromAI[] {
  const parallel: ActionFromAI[] = [];
  const physiological: ActionFromAI[] = [];
  const rest: ActionFromAI[] = [];
  for (const a of actions) {
    const t = a.text;
    if (PARALLEL_KEYWORDS.test(t)) parallel.push(a);
    else if (PHYSIOLOGICAL_KEYWORDS.test(t)) physiological.push(a);
    else rest.push(a);
  }
  return [...parallel, ...physiological, ...rest];
}

function buildWorkflowReason(result: ParseActionsResult): string {
  const parts: string[] = [];
  if (result.notes) parts.push(result.notes);
  if (result.truncated) parts.push("12개 초과분은 생략했습니다.");
  if (parts.length === 0) return "입력 내용을 바탕으로 행동을 분해했습니다.";
  return parts.join(" ");
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function GET() {
  return NextResponse.json({ ok: true });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawInput = typeof body?.text === "string" ? body.text : "";

    const result = await parseActionsFromText(rawInput);
    console.log(
      "[api/structure] parsed actions:",
      result.actions.length,
      "intent:",
      result.intent,
      "labels:",
      result.actions.map((a) => a.text)
    );
    const ordered = orderActionsByRule(result.actions);
    const actions = ordered.map((a) => ({ label: a.text, minutes: estimateMinutesFromLabel(a.text) }));
    const firstLabel = actions[0]?.label ?? "할 일";
    const firstMinutes = actions[0]?.minutes ?? estimateMinutesFromLabel(firstLabel);

    const data = {
      title: rawInput.slice(0, 50).trim() || firstLabel || "제목",
      goals: [] as string[],
      branches: [] as string[],
      blockers: [] as string[],
      actions,
      pickNow: {
        label: firstLabel,
        minutes: firstMinutes,
        reason: result.intent === "prioritize" ? "우선순위 반영 첫 작업" : "첫 번째 할 일",
      },
      workflowReason: buildWorkflowReason(result),
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
