import { Platform } from "react-native";

const HISTORY_KEY = "startnow_history";
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
