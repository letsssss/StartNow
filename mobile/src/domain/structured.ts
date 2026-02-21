/** API 응답과 동일한 구조화 결과 타입 (고정) */
export interface ActionItem {
  label: string;
  minutes: number;
}

export interface PickNowItem {
  label: string;
  minutes: number;
  reason: string;
}

export interface StructuredOutput {
  title: string;
  goals: string[];
  branches: string[];
  blockers: string[];
  actions: ActionItem[];
  pickNow: PickNowItem;
  workflowReason: string;
}
