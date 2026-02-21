import React, { useEffect, useState, useMemo, useLayoutEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  Animated,
  Dimensions,
} from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
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
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [inProgress, setInProgress] = useState(false);
  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const [runningStepId, setRunningStepId] = useState<string | null>(null);
  const [stepDoneMap, setStepDoneMap] = useState<Record<string, boolean>>({});
  const [orderedSteps, setOrderedSteps] = useState(() =>
    data ? normalizeToWorkflowSteps(data) : []
  );
  const [workflowCompleted, setWorkflowCompleted] = useState(false);
  const [lastCompletedStepId, setLastCompletedStepId] = useState<string | null>(null);
  const stepCompleteTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (data) setOrderedSteps(normalizeToWorkflowSteps(data));
  }, [data]);

  useEffect(() => {
    return () => {
      if (stepCompleteTimeoutRef.current) clearTimeout(stepCompleteTimeoutRef.current);
    };
  }, []);

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

  const handleStartPickNow = () => {
    if (!data) return;
    if (activeStepId === null) {
      const middleSteps = orderedSteps.filter((s) => s.kind === "step");
      const current = middleSteps.find((s) => s.title === data.pickNow.label) ?? middleSteps[0];
      const id = current?.id ?? null;
      setActiveStepId(id);
      setRunningStepId(id);
    } else {
      setRunningStepId(activeStepId);
    }
    setInProgress(true);
  };

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

  useEffect(() => {
    if (!toast) return;
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
      toastTimeoutRef.current = null;
    }, 2000);
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
        toastTimeoutRef.current = null;
      }
    };
  }, [toast]);

  const handleComplete = () => {
    const middleSteps = orderedSteps.filter((s) => s.kind === "step");
    const runningIndex = middleSteps.findIndex((s) => s.id === runningStepId);
    const runningStep = runningIndex >= 0 ? middleSteps[runningIndex] : null;
    const nextStep =
      runningIndex >= 0 && runningIndex + 1 < middleSteps.length
        ? middleSteps[runningIndex + 1]
        : null;

    if (runningStep) {
      setStepDoneMap((prev) => ({ ...prev, [runningStep.id]: true }));
      setLastCompletedStepId(runningStep.id);
      if (stepCompleteTimeoutRef.current) clearTimeout(stepCompleteTimeoutRef.current);
      stepCompleteTimeoutRef.current = setTimeout(() => {
        setLastCompletedStepId(null);
        stepCompleteTimeoutRef.current = null;
      }, 500);
    }

    if (nextStep) {
      setActiveStepId(nextStep.id);
    } else {
      setActiveStepId(null);
      setWorkflowCompleted(true);
    }
    setRunningStepId(null);
    setInProgress(false);

    setLastRecordMessage("완료했어요");
    setToast("완료했어요");
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
            setRunningStepId(null);
            setActiveStepId(null);
            setInProgress(false);
          },
        })),
        { text: "취소", style: "cancel" },
      ]
    );
  };

  const activeStepTitle =
    (activeStepId ? orderedSteps.find((s) => s.id === activeStepId)?.title : null) ??
    data?.pickNow?.label ??
    "";

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

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, inProgress && styles.contentWithBottomBar]}
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
            inProgress={inProgress}
            lastCompletedStepId={lastCompletedStepId}
            activeStepTitle={
              inProgress
                ? (orderedSteps.find((s) => s.id === runningStepId)?.title ?? "")
                : activeStepTitle
            }
          />
        </View>

        <Text style={styles.sectionLabel}>순서를 이렇게 잡았어요</Text>
        <Text style={styles.workflowReason}>{data.workflowReason}</Text>

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

      {inProgress ? (
        <View style={styles.bottomActionBar}>
          <Text style={styles.bottomActionBarLabel} numberOfLines={1}>
            지금 하는 중: {runningStepId ? orderedSteps.find((s) => s.id === runningStepId)?.title ?? "" : ""}
          </Text>
          <View style={styles.bottomActionBarButtons}>
            <TouchableOpacity style={[styles.endBtn, styles.completeBtn]} onPress={handleComplete}>
              <Text style={styles.endBtnText}>완료</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.endBtn, styles.abortBtn]} onPress={handleAbort}>
              <Text style={styles.endBtnTextAbort}>중단</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {toast ? (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      ) : null}

      {workflowCompleted ? (
        <WorkflowCompleteEffect onDone={() => setWorkflowCompleted(false)} />
      ) : null}
    </View>
  );
}

const SPARKLE_POSITIONS = [
  { x: 0.15, y: 0.28, emoji: "✨", size: 26 },
  { x: 0.5, y: 0.22, emoji: "🌟", size: 40 },
  { x: 0.85, y: 0.3, emoji: "✨", size: 24 },
  { x: 0.25, y: 0.38, emoji: "⭐", size: 22 },
  { x: 0.75, y: 0.36, emoji: "✨", size: 28 },
  { x: 0.1, y: 0.45, emoji: "🌟", size: 22 },
  { x: 0.9, y: 0.44, emoji: "⭐", size: 24 },
  { x: 0.35, y: 0.5, emoji: "✨", size: 20 },
  { x: 0.65, y: 0.48, emoji: "🎉", size: 28 },
];

const FULL_COMPLETE_DURATION_MS = 1500;

function WorkflowCompleteEffect({ onDone }: { onDone: () => void }) {
  const sparkleOpacity = useRef(new Animated.Value(1)).current;
  const messageOpacity = useRef(new Animated.Value(0)).current;
  const messageScale = useRef(new Animated.Value(0.7)).current;
  const fadeDuration = 400;
  const fadeStartDelay = FULL_COMPLETE_DURATION_MS - fadeDuration;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(messageOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(messageScale, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(sparkleOpacity, {
          toValue: 0,
          duration: fadeDuration,
          useNativeDriver: true,
        }),
        Animated.timing(messageOpacity, {
          toValue: 0,
          duration: fadeDuration,
          useNativeDriver: true,
        }),
      ]).start(() => onDone());
    }, fadeStartDelay);

    return () => clearTimeout(timer);
  }, [sparkleOpacity, messageOpacity, messageScale, onDone]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View
        style={[
          styles.fullCompleteMessage,
          {
            opacity: messageOpacity,
            transform: [{ scale: messageScale }],
          },
        ]}
      >
        <Text style={styles.fullCompleteMessageText}>오늘 할 일 완료 🎉</Text>
        <Text style={styles.fullCompleteMessageSub}>워크플로우를 끝냈어요</Text>
      </Animated.View>
      {SPARKLE_POSITIONS.map((p, i) => (
        <Animated.View
          key={i}
          style={[
            styles.sparkleWrap,
            {
              left: SCREEN_WIDTH * p.x - 14,
              top: SCREEN_HEIGHT * p.y - 14,
              opacity: sparkleOpacity,
            },
          ]}
        >
          <Text style={[styles.sparkleEmoji, { fontSize: p.size }]}>{p.emoji}</Text>
        </Animated.View>
      ))}
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
  endBtn: { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: "center" },
  completeBtn: { backgroundColor: "#34C759" },
  abortBtn: { backgroundColor: "#E5E5EA" },
  endBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  endBtnTextAbort: { color: "#000", fontSize: 16, fontWeight: "600" },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 24 },
  contentWithBottomBar: { paddingBottom: 100 },
  bottomActionBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#1C1C1E",
    borderTopWidth: 1,
    borderTopColor: "#3A3A3C",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
  bottomActionBarLabel: {
    fontSize: 13,
    color: "#8E8E93",
    marginBottom: 10,
  },
  bottomActionBarButtons: { flexDirection: "row", gap: 12 },
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
  sparkleWrap: {
    position: "absolute",
  },
  sparkleEmoji: {},
  fullCompleteMessage: {
    position: "absolute",
    left: SCREEN_WIDTH / 2 - 120,
    top: SCREEN_HEIGHT * 0.38 - 40,
    width: 240,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  fullCompleteMessageText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 6,
  },
  fullCompleteMessageSub: {
    fontSize: 15,
    color: "#666",
  },
});
