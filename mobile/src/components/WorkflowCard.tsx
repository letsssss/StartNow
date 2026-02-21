import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import type { WorkflowStep, WorkflowStepIcon } from "../domain/workflow";

const ICON_MAP: Record<WorkflowStepIcon, string> = {
  spark: "✦",
  person: "👤",
  mail: "✉",
  gear: "⚙",
  check: "✓",
};

type Props = {
  step: WorkflowStep;
  onToggleDone?: (id: string) => void;
  showStartButton?: boolean;
  onStart?: () => void;
  onDrag?: () => void;
  isActive?: boolean;
  isCurrentStep?: boolean;
  dimmed?: boolean;
};

export function WorkflowCard({
  step,
  onToggleDone,
  showStartButton,
  onStart,
  onDrag,
  isActive,
  isCurrentStep,
  dimmed,
}: Props) {
  const isStartOrEnd = step.kind === "start" || step.kind === "end";
  const subtitle = step.subtitle ?? null;
  const draggable = step.kind === "step" && !!onDrag && !dimmed;

  const handlePress = () => {
    if (step.kind === "step" && onToggleDone) onToggleDone(step.id);
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isStartOrEnd && styles.cardHighlight,
        step.done && styles.cardDone,
        isActive && styles.cardActive,
        isCurrentStep && styles.cardCurrentStep,
        dimmed && styles.cardDimmed,
      ]}
      onPress={handlePress}
      onLongPress={draggable ? onDrag : undefined}
      delayLongPress={200}
      activeOpacity={step.kind === "step" ? 0.7 : 1}
      disabled={step.kind !== "step" || dimmed}
    >
      <View style={styles.iconBadge}>
        <Text style={styles.iconText}>{ICON_MAP[step.icon]}</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
          {step.title}
        </Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {showStartButton && onStart ? (
        <TouchableOpacity style={styles.startBtn} onPress={onStart} activeOpacity={0.8}>
          <Text style={styles.startBtnText}>시작</Text>
        </TouchableOpacity>
      ) : null}
      <View style={styles.orderBadge}>
        <Text style={styles.orderText}>{String(step.order).padStart(2, "0")}</Text>
      </View>
      {step.kind === "step" && step.done ? (
        <View style={styles.doneMark}>
          <Text style={styles.doneMarkText}>✓</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2C2C2E",
    borderRadius: 18,
    padding: 14,
    marginHorizontal: 8,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    minHeight: 56,
  },
  cardHighlight: {
    backgroundColor: "#1B3A2E",
    borderColor: "rgba(72,187,120,0.35)",
  },
  cardDone: { opacity: 0.75 },
  cardActive: { opacity: 0.92, transform: [{ scale: 1.02 }] },
  cardCurrentStep: {
    backgroundColor: "rgba(52,199,89,0.25)",
    borderColor: "rgba(52,199,89,0.5)",
  },
  cardDimmed: { opacity: 0.45 },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  iconText: { fontSize: 18, color: "#fff" },
  body: { flex: 1, minWidth: 0 },
  title: { fontSize: 16, fontWeight: "600", color: "#fff" },
  subtitle: { fontSize: 12, color: "#8E8E93", marginTop: 2 },
  startBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#007AFF",
    marginRight: 8,
  },
  startBtnText: { fontSize: 13, fontWeight: "600", color: "#fff" },
  orderBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#3A3A3C",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 0,
  },
  orderText: { fontSize: 11, color: "#8E8E93", fontWeight: "600" },
  doneMark: { marginLeft: 4 },
  doneMarkText: { fontSize: 16, color: "#34C759", fontWeight: "700" },
});
