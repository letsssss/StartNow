/**
 * parseActionsFromText: raw 사용자 입력을 OpenAI로 보내 행동(actions) 배열로 분해.
 *
 * 수정 요약:
 * - 수정한 파일: api/src/infra/parseActionsFromText.ts
 * - WORKFLOW_SYSTEM_PROMPT: [workflowReason 작성 규칙] 추가 — notes는 "이 순서의 이유/기준"만, A/B/C 중 1개 이상, 행동 인용, 140자, 금지어 없음
 * - SYSTEM_PROMPT: notes 필드는 위 workflowReason 규칙 준수 명시
 * - 가드레일(검증 실패 조건): notes 빈 문자열, 200자 초과, actions label 미인용, 금지어(화이팅/동기/습관/마음가짐/중요합니다 등) 포함 → fallback 1문장 적용
 * - user 메시지: rawInput만 유지
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

[workflowReason 작성 규칙 – 1단계]
- workflowReason(notes)는 "왜 이 순서인지"만 설명한다.
- 사용자의 요청 유형, 의도(intent), 분석 과정은 절대 언급하지 않는다.
- "우선순위 요청", "요청을 반영", "분석", "의도" 같은 표현을 사용하지 않는다.
- 실제 행동(actions)의 label을 최소 1개 이상 그대로 인용한다.
- 한국어 1~2문장, 최대 140자.
- 감정 코칭, 동기부여, 일반론은 금지한다.

[workflowReason 작성 규칙] (notes 필드에 반드시 아래 형식 중 하나만 사용)
- notes는 아래 3가지 문장 형식 중 정확히 하나로만 작성한다. {A}, {B}에는 actions의 label(행동명)을 넣는다.
  1) "{A}를 먼저 해두면 기다리는 동안 {B}를 할 수 있어서 이 순서로 잡았어요."
  2) "{A}부터 시작해야 다음 단계가 자연스럽게 이어져서 이 순서로 잡았어요."
  3) "{A}를 먼저 처리하면 이후 단계가 막히지 않아 이 순서가 가장 수월해요."
- 형식 1은 병렬 가능한 두 작업(앞선 작업·대기 중 할 작업)일 때, 2는 시작점이 명확할 때, 3은 선후 의존이 있을 때 사용한다.
- 다른 문장 형태·일반론·동기부여 금지.
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
- notes 필드는 [workflowReason 작성 규칙 – 1단계]와 [workflowReason 작성 규칙]을 따른다. intent·요청 유형·분석 언급 금지, 3가지 형식 중 하나로만 작성, {A},{B}는 actions의 label로 채운다.
- 출력은 무조건 JSON만.`;

const USER_PROMPT_PREFIX = `이제 아래 사용자 입력에서 actions를 추출해라:
<<<`;
const USER_PROMPT_SUFFIX = `>>>

끝.`;

const MAX_ACTIONS = 50;
const MAX_NOTES_LENGTH = 200;
const FORBIDDEN_PATTERNS = /좋은\s*습관|동기|마음가짐|해보자|화이팅|중요합니다/;

const NOTES_ENDINGS = [
  "이 순서로 잡았어요.",
  "이 순서가 가장 수월해요.",
];

const MIN_MINUTES = 5;
const MAX_MINUTES = 120;
const DEFAULT_MINUTES = 20;
const FALLBACK_MINUTES = 15;

/**
 * label 기준 현실적인 소요 시간(분) 추정.
 * - 최소 5분, 최대 120분.
 * - 추정 실패 시에만 15분 fallback.
 */
export function estimateMinutesFromLabel(label: string): number {
  const t = (label || "").trim();
  if (t.length === 0) return FALLBACK_MINUTES;

  const lower = t.toLowerCase();

  const waitingShort = /빨래|세탁|돌리기|건조|탈수|세탁기|전자레인지|끓이기\s*시작|요리\s*시작|담그기/;
  if (waitingShort.test(t) || waitingShort.test(lower)) return clampToRange(10);

  const mealPrepMove = /밥|먹기|식사|아침|점심|저녁|준비|이동|출발|도착|약\s*먹|화장실|샤워|양치|세수|머리\s*말리/;
  if (mealPrepMove.test(t) || mealPrepMove.test(lower)) return clampToRange(25);

  const studyWork = /공부|작업|과제|보고서|정리|회의|미팅|운동|헬스|요가|독서|영어|학습|코딩|개발|작성|제출/;
  if (studyWork.test(t) || studyWork.test(lower)) return clampToRange(50);

  const quick = /청소|쓰레기|설거지|빨래\s*개기|접기|짐\s*싸기/;
  if (quick.test(t) || quick.test(lower)) return clampToRange(15);

  return clampToRange(DEFAULT_MINUTES);
}

function clampToRange(minutes: number): number {
  return Math.max(MIN_MINUTES, Math.min(MAX_MINUTES, minutes));
}

function validateWorkflowReason(notes: string, actions: ActionFromAI[]): boolean {
  if (!notes || notes.trim().length === 0) return false;
  if (notes.length > MAX_NOTES_LENGTH) return false;
  const hasAction = actions.some((a) => a.text && notes.includes(a.text));
  if (!hasAction) return false;
  if (FORBIDDEN_PATTERNS.test(notes)) return false;
  const endsWithFormat = NOTES_ENDINGS.some((end) => notes.trim().endsWith(end));
  if (!endsWithFormat) return false;
  return true;
}

function fallbackWorkflowReason(actions: ActionFromAI[]): string {
  const first = actions[0]?.text ?? "할 일";
  return `${first}부터 시작해야 다음 단계가 자연스럽게 이어져서 이 순서로 잡았어요.`;
}

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

    const rawIntent = (parsed as { intent?: unknown }).intent;
    const intentCandidate = typeof rawIntent === "string" ? rawIntent : undefined;

    const intent = (["prioritize", "list", "decide", "unknown"] as const).includes(
      intentCandidate as any
    )
      ? (intentCandidate as ParseActionsResult["intent"])
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
      console.log("[parseActionsFromText] actions 50개 초과, 상위 50개만 사용. truncated=true");
    }

    let finalNotes = notes.trim();
    if (!validateWorkflowReason(finalNotes, actions)) {
      console.warn(
        "[parseActionsFromText] workflowReason(notes) 검증 실패(빈문자열/200자초과/행동미인용/금지어). fallback 적용."
      );
      finalNotes = fallbackWorkflowReason(actions);
    }

    return {
      intent,
      actions,
      notes: finalNotes,
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
