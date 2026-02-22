// History 및 캘린더 저장(AsyncStorage) — 완료 기록 로드/저장/삭제, 결과 화면 복원용 resultData, 캘린더 엔트리 append.
import { Platform } from "react-native";

const HISTORY_KEY = "startnow_history";
const CALENDAR_ENTRIES_KEY = "startnow_calendar_entries";
const MAX_RECORDS = 200;

type StorageAdapter = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
};

async function getStorage(): Promise<StorageAdapter> {
  if (Platform.OS === "web") {
    return {
      getItem: (key: string) => Promise.resolve(localStorage.getItem(key)),
      setItem: (key: string, value: string) => {
        localStorage.setItem(key, value);
        return Promise.resolve();
      },
    };
  }
  const mod = await import("@react-native-async-storage/async-storage");
  const AsyncStorage = mod.default;
  return {
    getItem: (key: string) => AsyncStorage.getItem(key),
    setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
  };
}

export type HistoryRecord = {
  id: string;
  completedDate: string; // YYYY-MM-DD
  time: string; // HH:mm
  title: string;
  steps: number;
  /** 복원용: 있으면 히스토리에서 탭 시 ResultScreen을 이 데이터로 렌더링 */
  resultData?: ResultData;
};

export async function loadHistory(): Promise<HistoryRecord[]> {
  try {
    const storage = await getStorage();
    const raw = await storage.getItem(HISTORY_KEY);
    if (raw == null || raw === "") return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (r): r is HistoryRecord =>
        r != null &&
        typeof r === "object" &&
        typeof r.id === "string" &&
        typeof r.completedDate === "string" &&
        typeof r.time === "string" &&
        typeof r.title === "string" &&
        typeof r.steps === "number"
    );
  } catch {
    return [];
  }
}

export async function saveHistory(records: HistoryRecord[]): Promise<void> {
  try {
    const storage = await getStorage();
    await storage.setItem(HISTORY_KEY, JSON.stringify(records));
  } catch {
    // no-op
  }
}

export async function appendHistory(record: HistoryRecord): Promise<HistoryRecord[]> {
  try {
    const records = await loadHistory();
    records.push(record);
    const trimmed = records.length > MAX_RECORDS ? records.slice(-MAX_RECORDS) : records;
    await saveHistory(trimmed);
    return trimmed;
  } catch {
    return [];
  }
}

export async function deleteHistoryRecord(id: string): Promise<HistoryRecord[]> {
  try {
    const records = await loadHistory();
    const next = records.filter((r) => r.id !== id);
    await saveHistory(next);
    return next;
  } catch {
    return [];
  }
}

// ——— 캘린더 엔트리 (ResultScreen 복원용) ———

export type CalendarStep = {
  id: string;
  order: number;
  label: string;
  sub?: string;
  status: "done" | "todo";
};

export type ResultData = {
  title: string;
  steps: CalendarStep[];
};

export type CalendarEntry = {
  id: string;
  dateKey: string;
  createdAt: number;
  resultData: ResultData;
};

async function loadCalendarEntries(): Promise<CalendarEntry[]> {
  try {
    const storage = await getStorage();
    const raw = await storage.getItem(CALENDAR_ENTRIES_KEY);
    if (raw == null || raw === "") return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is CalendarEntry =>
        e != null &&
        typeof e === "object" &&
        typeof e.id === "string" &&
        typeof e.dateKey === "string" &&
        typeof e.createdAt === "number" &&
        e.resultData != null &&
        typeof e.resultData.title === "string" &&
        Array.isArray(e.resultData.steps)
    );
  } catch {
    return [];
  }
}

export async function saveCalendarEntry(
  entry: Omit<CalendarEntry, "id">
): Promise<string> {
  const id =
    "cal_" + Date.now() + "_" + Math.random().toString(36).slice(2, 11);
  const full: CalendarEntry = { ...entry, id };
  const list = await loadCalendarEntries();
  list.push(full);
  const storage = await getStorage();
  await storage.setItem(CALENDAR_ENTRIES_KEY, JSON.stringify(list));
  return id;
}
