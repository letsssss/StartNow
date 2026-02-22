import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";
import { loadHistory, type HistoryRecord } from "../lib/historyStorage";

type Props = NativeStackScreenProps<RootStackParamList, "History">;

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

function toYMD(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function parseYMD(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function startOfWeekMonday(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function sameYMD(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

export function HistoryScreen({ navigation }: Props) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [sessions, setSessions] = useState<HistoryRecord[]>([]);
  const [cursorMonth, setCursorMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState<string>(() => toYMD(today));

  useFocusEffect(
    useCallback(() => {
      loadHistory().then(setSessions);
    }, [])
  );

  const completedSet = useMemo(
    () => new Set(sessions.map((s) => s.completedDate)),
    [sessions]
  );

  const totalCount = sessions.length;

  const weeklyCount = useMemo(() => {
    const start = startOfWeekMonday(today);
    const end = addDays(start, 7);
    return sessions.filter((s) => {
      const d = parseYMD(s.completedDate);
      return d >= start && d < end;
    }).length;
  }, [today, sessions]);

  const streakDays = useMemo(() => {
    let streak = 0;
    for (let i = 0; i < 366; i++) {
      const d = addDays(today, -i);
      if (completedSet.has(toYMD(d))) streak++;
      else break;
    }
    return streak;
  }, [today, completedSet]);

  const sessionsForSelected = useMemo(
    () => sessions.filter((s) => s.completedDate === selectedDate),
    [sessions, selectedDate]
  );

  const monthLabel = useMemo(() => {
    return cursorMonth.toLocaleString("en-US", { month: "long", year: "numeric" });
  }, [cursorMonth]);

  const calendarDays = useMemo(() => {
    const first = new Date(
      cursorMonth.getFullYear(),
      cursorMonth.getMonth(),
      1
    );
    const start = startOfWeekMonday(first);
    const grid: Date[] = [];
    for (let i = 0; i < 42; i++) grid.push(addDays(start, i));
    return grid;
  }, [cursorMonth]);

  const selected = parseYMD(selectedDate);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
            <Text style={styles.headerLink}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>History</Text>
          <TouchableOpacity
            onPress={() => {
              setCursorMonth(
                new Date(today.getFullYear(), today.getMonth(), 1)
              );
              setSelectedDate(toYMD(today));
            }}
            hitSlop={12}
          >
            <Text style={styles.todayBtn}>Today</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{streakDays}</Text>
            <Text style={styles.statLabel}>STREAK</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{weeklyCount}</Text>
            <Text style={styles.statLabel}>THIS WEEK</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{totalCount}</Text>
            <Text style={styles.statLabel}>TOTAL</Text>
          </View>
        </View>

        {/* Calendar */}
        <View style={styles.calendar}>
          <View style={styles.calendarNav}>
            <TouchableOpacity
              onPress={() =>
                setCursorMonth(
                  new Date(cursorMonth.getFullYear(), cursorMonth.getMonth() - 1, 1)
                )
              }
              style={styles.navBtn}
            >
              <Text style={styles.navBtnText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.monthLabel}>{monthLabel}</Text>
            <TouchableOpacity
              onPress={() =>
                setCursorMonth(
                  new Date(cursorMonth.getFullYear(), cursorMonth.getMonth() + 1, 1)
                )
              }
              style={styles.navBtn}
            >
              <Text style={styles.navBtnText}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.weekdayRow}>
            {WEEKDAYS.map((d) => (
              <Text key={d} style={styles.weekday}>
                {d}
              </Text>
            ))}
          </View>

          <View style={styles.daysGrid}>
            {calendarDays.map((d) => {
              const ymd = toYMD(d);
              const inMonth = d.getMonth() === cursorMonth.getMonth();
              const isToday = sameYMD(d, today);
              const isSelected = sameYMD(d, selected);
              const hasDone = completedSet.has(ymd);

              return (
                <TouchableOpacity
                  key={ymd}
                  onPress={() => setSelectedDate(ymd)}
                  style={[
                    styles.dayCell,
                    !inMonth && styles.dayCellDim,
                    isSelected && styles.dayCellSelected,
                    isToday && !isSelected && styles.dayCellToday,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayNum,
                      !inMonth && styles.dayNumDim,
                      isSelected && styles.dayNumSelected,
                    ]}
                  >
                    {d.getDate()}
                  </Text>
                  {hasDone && !isSelected ? (
                    <View style={styles.dot} />
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* List */}
        <View style={styles.listSection}>
          <Text style={styles.listSectionTitle}>
            {selected.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "2-digit",
            }).toUpperCase()}
          </Text>

          {sessionsForSelected.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                이날은 완료 기록이 없습니다.
              </Text>
            </View>
          ) : (
            <View style={styles.cardList}>
              {sessionsForSelected.map((s) => (
                <View key={s.id} style={styles.card}>
                  <Text style={styles.cardTitle}>{s.title}</Text>
                  <View style={styles.cardMeta}>
                    <Text style={styles.cardMetaText}>🕒 {s.time}</Text>
                    <Text style={styles.cardMetaText}>{s.steps} steps</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backBtnText}>입력 화면으로</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1C1C1E",
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: 20,
    paddingTop: 56,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  headerLink: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  todayBtn: {
    fontSize: 14,
    color: "#34d399",
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 16,
    alignItems: "center",
  },
  statValue: {
    fontSize: 22,
    fontWeight: "600",
    color: "#fff",
  },
  statLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.6)",
    marginTop: 4,
  },
  calendar: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 16,
    marginBottom: 24,
  },
  calendarNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  navBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  navBtnText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
  },
  monthLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#fff",
  },
  weekdayRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  weekday: {
    flex: 1,
    textAlign: "center",
    fontSize: 11,
    color: "rgba(255,255,255,0.5)",
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: "14.28%",
    aspectRatio: 1,
    maxHeight: 44,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 22,
  },
  dayCellDim: {
    opacity: 0.4,
  },
  dayCellSelected: {
    backgroundColor: "rgba(52, 211, 153, 0.9)",
  },
  dayCellToday: {
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.6)",
  },
  dayNum: {
    fontSize: 14,
    color: "#fff",
  },
  dayNumDim: {
    color: "rgba(255,255,255,0.5)",
  },
  dayNumSelected: {
    color: "#000",
  },
  dot: {
    position: "absolute",
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#34d399",
  },
  listSection: {
    marginBottom: 24,
  },
  listSectionTitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    marginBottom: 12,
  },
  emptyCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 16,
  },
  emptyText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
  },
  cardList: {
    gap: 12,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 16,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 8,
  },
  cardMetaText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
  },
  backBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  backBtnText: {
    fontSize: 15,
    color: "#fff",
    fontWeight: "500",
  },
});
