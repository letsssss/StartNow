import type { StructuredOutput } from "../domain/structured";

let lastResult: StructuredOutput | null = null;
let lastRecordMessage: string | null = null;
let lastInputText = "";

export function setLastStructuredResult(data: StructuredOutput | null): void {
  lastResult = data;
}

export function getLastStructuredResult(): StructuredOutput | null {
  return lastResult;
}

export function setLastRecordMessage(msg: string | null): void {
  lastRecordMessage = msg;
}

export function getLastRecordMessage(): string | null {
  return lastRecordMessage;
}

export function setLastInputText(text: string): void {
  lastInputText = text;
}

export function getLastInputText(): string {
  return lastInputText;
}
