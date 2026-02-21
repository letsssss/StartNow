/**
 * parseActionsFromText: raw 사용자 입력을 OpenAI로 보내 행동(actions) 배열로 분해.
 *
 * 수정 요약 (워크플로우 원칙 적용):
 * - 수정한 파일: api/src/infra/parseActionsFromText.ts (OpenAI 호출은 route.ts가 아닌 이 파일에서만 수행)
 * - 추가된 상수: WORKFLOW_SYSTEM_PROMPT (단순 나열 금지, 시작점/선후관계/병렬/decision/wait 원칙)
 * - OpenAI messages: [ system(WORKFLOW_SYSTEM_PROMPT + SYSTEM_PROMPT), user(rawInput) ] — 조건 없이 항상 적용
 */

import OpenAI from "openai";

export type ActionFromAI = {
  text: string;
  confidence: "high" | "low";
  reason: string;
};

export type ParseActionsResult = {
  intent: "prioritize" | "list" | "decide" | "unknown";
  actions: ActionFromAI[];
  notes: string;
  truncated: boolean;
};

const WORKFLOW_SYSTEM_PROMPT = `
너는 단순한 할 일 나열기가 아니다.
너는 사용자의 입력을 분석해 "워크플로우"를 설계하는 엔진이다.

워크플로우 설계 원칙(반드시 적용):
1. 시작점(start)을 반드시 하나 정한다.
2. 선후관계가 있으면 dependsOn으로 표현한다.
3. 동시에 가능한 작업은 병렬(parallelizable)로 판단한다.
4. 사용자가 고민/선택을 표현하면 decision 노드를 만든다.
5. 시간이 흐르는 대기는 wait 노드로 분리한다.
6. 결과는 사람이 짠 것처럼 자연스러운 흐름이어야 한다.

절대 규칙:
- 단순 나열 금지
- 출력은 반드시 JSON만
`;

const SYSTEM_PROMPT = `너는 한국어 문장에서 사용자가 해야 할 '행동(Action)'을 추출해 워크플로우로 만들기 위한 파서다.
반드시 JSON만 출력한다. 설명 문장 금지.

출력 JSON 스키마:
{
  "intent": "prioritize" | "list" | "decide" | "unknown",
  "actions": [
    {
      "text": string,
      "confidence": "high" | "low",
      "reason": string
    }
  ],
  "notes": string,
  "truncated": boolean
}

규칙:
- 문장에 '하고/그리고/다음에/후에/이후/랑/며' 등으로 나열된 행동이 있으면 모두 분리한다.
- '해야 하는데, 해야 돼, 해야 함' 등은 행동 힌트다.
- '뭐부터/우선/먼저/순서/어느 것'이 있으면 intent는 prioritize.
- 행동은 가능한 한 동사형으로 정규화한다(명사만 있으면 "~하기"로).
- 애매하면 confidence=low로 넣되 reason을 1줄로.
- 출력은 무조건 JSON만.`;

const USER_PROMPT_PREFIX = `이제 아래 사용자 입력에서 actions를 추출해라:
<<<`;
const USER_PROMPT_SUFFIX = `>>>

끝.`;

const MAX_ACTIONS = 12;

function extractJsonFromResponse(content: string): string | null {
  const trimmed = content.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  return trimmed.slice(start, end + 1);
}

export async function parseActionsFromText(rawInput: string): Promise<ParseActionsResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  if (!apiKey) {
    console.error("[parseActionsFromText] OPENAI_API_KEY 없음");
    return fallbackResult(rawInput);
  }

  const openai = new OpenAI({ apiKey });

  try {
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: WORKFLOW_SYSTEM_PROMPT + "\n\n" + SYSTEM_PROMPT },
        { role: "user", content: rawInput },
      ],
      temperature: 0.2,
    });

    const rawContent = completion.choices[0]?.message?.content;
    if (!rawContent) {
      console.warn("[parseActionsFromText] AI 응답 내용 없음");
      return fallbackResult(rawInput);
    }

    const jsonStr = extractJsonFromResponse(rawContent);
    if (!jsonStr) {
      console.warn("[parseActionsFromText] AI 응답에서 JSON 추출 실패. raw:", rawContent.slice(0, 200));
      return fallbackResult(rawInput);
    }

    const parsed = JSON.parse(jsonStr) as unknown;
    if (!parsed || typeof parsed !== "object") {
      console.warn("[parseActionsFromText] 파싱 결과가 객체가 아님:", typeof parsed);
      return fallbackResult(rawInput);
    }

    const intent = ["prioritize", "list", "decide", "unknown"].includes((parsed as { intent?: string }).intent)
      ? (parsed as { intent: ParseActionsResult["intent"] }).intent
      : "unknown";
    const notes = typeof (parsed as { notes?: string }).notes === "string" ? (parsed as { notes: string }).notes : "";
    const truncated = Boolean((parsed as { truncated?: boolean }).truncated);

    let actions: ActionFromAI[] = Array.isArray((parsed as { actions?: unknown }).actions)
      ? ((parsed as { actions: unknown[] }).actions
          .filter(
            (a): a is ActionFromAI =>
              a != null &&
              typeof a === "object" &&
              typeof (a as ActionFromAI).text === "string" &&
              ["high", "low"].includes((a as ActionFromAI).confidence)
          )
          .map((a) => ({
            text: String((a as ActionFromAI).text).trim(),
            confidence: (a as ActionFromAI).confidence,
            reason: typeof (a as ActionFromAI).reason === "string" ? (a as ActionFromAI).reason : "",
          })))
      : [];

    actions = actions.filter((a) => a.text.length > 0);

    if (actions.length === 0) {
      console.warn("[parseActionsFromText] actions 배열 비어 있음, fallback");
      return fallbackResult(rawInput);
    }

    const truncatedResult = actions.length > MAX_ACTIONS;
    if (truncatedResult) {
      actions = actions.slice(0, MAX_ACTIONS);
      console.log("[parseActionsFromText] actions 12개 초과, 상위 12개만 사용. truncated=true");
    }

    return {
      intent,
      actions,
      notes,
      truncated: truncated || truncatedResult,
    };
  } catch (e) {
    if (e instanceof SyntaxError) {
      console.error("[parseActionsFromText] AI 응답 JSON 파싱 실패 (유효하지 않은 JSON):", e.message);
    } else {
      console.error("[parseActionsFromText]", e);
    }
    return fallbackResult(rawInput);
  }
}

function fallbackResult(rawInput: string): ParseActionsResult {
  const label = rawInput.trim().slice(0, 80) || "할 일";
  return {
    intent: "unknown",
    actions: [{ text: label, confidence: "low", reason: "AI 파싱 실패로 원문 전체를 한 작업으로 사용" }],
    notes: "",
    truncated: false,
  };
}
