import React, { useEffect, useState, useMemo, useLayoutEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from "react-native";
import {
  getLastStructuredResult,
  getLastRecordMessage,
  setLastRecordMessage,
} from "../state/session";
import { normalizeToWorkflowSteps, mergeWithStartEnd } from "../domain/workflow";
import { WorkflowTimeline } from "../components/WorkflowTimeline";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";

const ABORT_REASONS = [
  { id: "산만", label: "산만" },
  { id: "피곤", label: "피곤" },
  { id: "일정변경", label: "일정변경" },
  { id: "기타", label: "기타" },
] as const;

type Props = NativeStackScreenProps<RootStackParamList, "Result">;

export function ResultScreen({ navigation }: Props) {
  const data = getLastStructuredResult();
  const [toast, setToast] = useState<string | null>(null);
  const [inProgress, setInProgress] = useState(false);
  const [stepDoneMap, setStepDoneMap] = useState<Record<string, boolean>>({});
  const [orderedSteps, setOrderedSteps] = useState(() =>
    data ? normalizeToWorkflowSteps(data) : []
  );

  useEffect(() => {
    if (data) setOrderedSteps(normalizeToWorkflowSteps(data));
  }, [data]);

  const stepsWithDone = useMemo(
    () =>
      orderedSteps.map((s) => ({
        ...s,
        done: s.kind === "step" ? !!stepDoneMap[s.id] : undefined,
      })),
    [orderedSteps, stepDoneMap]
  );

  const handleToggleStepDone = (id: string) => {
    setStepDoneMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleStartPickNow = () => setInProgress(true);

  const handleReorderMiddle = useCallback((newMiddle: typeof orderedSteps) => {
    setOrderedSteps((prev) => {
      if (prev.length < 2) return prev;
      const start = prev[0];
      const end = prev[prev.length - 1];
      return mergeWithStartEnd(start, newMiddle, end);
    });
  }, []);

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.replace("Input");
  }, [navigation]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity onPress={handleBack} style={styles.headerBackTouch}>
          <Text style={styles.headerBackText}>뒤로</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, handleBack]);

  useEffect(() => {
    const msg = getLastRecordMessage();
    if (msg) {
      setToast(msg);
      setLastRecordMessage(null);
    }
  }, []);

  const handleComplete = () => {
    setLastRecordMessage("완료했어요");
    setToast("완료했어요");
    setInProgress(false);
  };

  const handleAbort = () => {
    Alert.alert(
      "중단 이유",
      "이유를 선택하세요",
      [
        ...ABORT_REASONS.map((r) => ({
          text: r.label,
          onPress: () => {
            setLastRecordMessage(`중단 (${r.label})`);
            setToast(`중단 (${r.label})`);
            setInProgress(false);
          },
        })),
        { text: "취소", style: "cancel" },
      ]
    );
  };

  if (!data) {
    return (
      <View style={styles.container}>
        <Text style={styles.empty}>결과가 없습니다. 입력에서 정리해 주세요.</Text>
      </View>
    );
  }

  const step = inProgress ? 3 : 2;

  return (
    <View style={styles.container}>
      <View style={styles.steps}>
        <Text style={[styles.step, 1 <= step && styles.stepDone]}>1 구조화 완료</Text>
        <Text style={styles.stepArrow}>→</Text>
        <Text style={[styles.step, 2 <= step && styles.stepDone]}>2 지금 할 1개 선택</Text>
        <Text style={styles.stepArrow}>→</Text>
        <Text style={[styles.step, 3 <= step && styles.stepDone]}>3 실행 시작</Text>
        <Text style={styles.stepArrow}>→</Text>
        <Text style={[styles.step, step >= 3 && styles.stepDone]}>4 체크/기록</Text>
      </View>

      {inProgress ? (
        <View style={styles.inProgressBlock}>
          <Text style={styles.inProgressLabel}>진행 중</Text>
          <Text style={styles.inProgressTitle}>{data.pickNow.label}</Text>
          <View style={styles.endButtons}>
            <TouchableOpacity style={[styles.endBtn, styles.completeBtn]} onPress={handleComplete}>
              <Text style={styles.endBtnText}>완료</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.endBtn, styles.abortBtn]} onPress={handleAbort}>
              <Text style={styles.endBtnTextAbort}>중단</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.orderGuide}>
              지금 할 순서: 1) 확인 → 2) 지금 할 1개 선택 → 3) 시작
            </Text>
            <View style={styles.timelineWrap}>
              <WorkflowTimeline
                steps={stepsWithDone}
                onToggleDone={handleToggleStepDone}
                onStartPickNow={handleStartPickNow}
                onReorderMiddle={handleReorderMiddle}
              />
            </View>

            <Text style={styles.sectionLabel}>왜 이런 순서인가요?</Text>
            <Text style={styles.workflowReason}>{data.workflowReason}</Text>

            <Text style={styles.title}>{data.title}</Text>
            <Text style={styles.sectionLabel}>목표</Text>
            {data.goals.map((g, i) => (
              <Text key={i} style={styles.bullet}>• {g}</Text>
            ))}
            {data.branches.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>가지 생각</Text>
                {data.branches.map((b, i) => (
                  <Text key={i} style={styles.bullet}>• {b}</Text>
                ))}
              </>
            )}
            {data.blockers.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>방해 요인</Text>
                {data.blockers.map((b, i) => (
                  <Text key={i} style={styles.bullet}>• {b}</Text>
                ))}
              </>
            )}
            <Text style={styles.sectionLabel}>행동 3개</Text>
            {data.actions.map((a, i) => (
              <Text key={i} style={styles.bullet}>
                • {a.label} ({a.minutes}분)
              </Text>
            ))}
            <View style={styles.spacer} />
          </ScrollView>

          {toast ? (
            <View style={styles.toast}>
              <Text style={styles.toastText}>{toast}</Text>
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  headerBackTouch: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginLeft: Platform.OS === "android" ? 8 : 0,
  },
  headerBackText: { fontSize: 16, color: "#007AFF" },
  steps: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  step: { fontSize: 11, color: "#999" },
  stepDone: { color: "#007AFF", fontWeight: "600" },
  stepArrow: { fontSize: 10, color: "#ccc" },
  inProgressBlock: { flex: 1, padding: 20, paddingTop: 24 },
  inProgressLabel: { fontSize: 13, color: "#666", marginBottom: 4 },
  inProgressTitle: { fontSize: 22, fontWeight: "700", marginBottom: 24 },
  endButtons: { flexDirection: "row", gap: 12 },
  endBtn: { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: "center" },
  completeBtn: { backgroundColor: "#34C759" },
  abortBtn: { backgroundColor: "#E5E5EA" },
  endBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  endBtnTextAbort: { color: "#000", fontSize: 16, fontWeight: "600" },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 24 },
  empty: { padding: 20, fontSize: 16, color: "#666" },
  orderGuide: { fontSize: 13, color: "#8E8E93", marginBottom: 12 },
  timelineWrap: {
    backgroundColor: "#1C1C1E",
    borderRadius: 16,
    paddingVertical: 12,
    marginBottom: 20,
    overflow: "hidden",
  },
  workflowReason: { fontSize: 14, lineHeight: 22, color: "#333", marginBottom: 16 },
  title: { fontSize: 18, fontWeight: "700", marginBottom: 16 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
    marginTop: 14,
    marginBottom: 4,
  },
  bullet: { fontSize: 15, marginLeft: 4, marginBottom: 2 },
  spacer: { height: 24 },
  toast: {
    position: "absolute",
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.75)",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  toastText: { color: "#fff", fontSize: 14 },
});
