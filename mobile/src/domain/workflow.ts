import type { StructuredOutput } from "./structured";

export type WorkflowStepIcon = "spark" | "person" | "mail" | "gear" | "check";

export type WorkflowStep = {
  id: string;
  order: number;
  title: string;
  icon: WorkflowStepIcon;
  kind: "start" | "step" | "end";
  done?: boolean;
  subtitle?: string;
};

const MAX_STEP_TITLE_LENGTH = 24;
const MIN_STEPS = 3;
const MAX_STEPS = 6;

function trimOneLine(text: string): string {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length <= MAX_STEP_TITLE_LENGTH ? t : t.slice(0, MAX_STEP_TITLE_LENGTH - 1) + "…";
}

const STEP_ICONS: WorkflowStepIcon[] = ["person", "mail", "gear"];

function iconForStepIndex(stepIndex: number): WorkflowStepIcon {
  return STEP_ICONS[stepIndex % STEP_ICONS.length];
}

export function normalizeToWorkflowSteps(data: StructuredOutput): WorkflowStep[] {
  const steps: WorkflowStep[] = [];
  const stepTitles: string[] = [];
  stepTitles.push(trimOneLine(data.pickNow.label));

  const rest: string[] = [];
  data.actions.forEach((a) => rest.push(a.label));
  data.branches.forEach((b) => rest.push(b));
  const maxRest = MAX_STEPS - 1;
  for (let i = 0; i < rest.length && stepTitles.length < maxRest; i++) {
    const t = trimOneLine(rest[i]);
    if (t && !stepTitles.includes(t)) stepTitles.push(t);
  }

  while (stepTitles.length < MIN_STEPS && rest.length > stepTitles.length) {
    const t = trimOneLine(rest[stepTitles.length]);
    if (t) stepTitles.push(t);
    else break;
  }

  const stepCount = stepTitles.length;
  steps.push({
    id: "start",
    order: 1,
    title: "워크플로우 시작",
    icon: "spark",
    kind: "start",
    subtitle: `총 ${stepCount}개의 단계가 감지되었습니다`,
  });

  stepTitles.forEach((title, i) => {
    steps.push({
      id: `step-${i + 1}`,
      order: steps.length + 1,
      title,
      icon: iconForStepIndex(i),
      kind: "step",
    });
  });

  steps.push({
    id: "end",
    order: steps.length + 1,
    title: "워크플로우 완료",
    icon: "check",
    kind: "end",
    subtitle: "모든 단계가 완료되었습니다",
  });

  return steps;
}

export function getMiddleSteps(steps: WorkflowStep[]): WorkflowStep[] {
  return steps.filter((s) => s.kind === "step");
}

export function mergeWithStartEnd(
  start: WorkflowStep,
  middle: WorkflowStep[],
  end: WorkflowStep
): WorkflowStep[] {
  return reassignOrder([start, ...middle, end]);
}

export function reassignOrder(steps: WorkflowStep[]): WorkflowStep[] {
  return steps.map((s, i) => ({ ...s, order: i + 1 }));
}
