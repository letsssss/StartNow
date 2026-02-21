import React from "react";
import { View, StyleSheet } from "react-native";
import DraggableFlatList, { type RenderItemParams } from "react-native-draggable-flatlist";
import { WorkflowCard } from "./WorkflowCard";
import type { WorkflowStep } from "../domain/workflow";

type Props = {
  steps: WorkflowStep[];
  onToggleDone?: (id: string) => void;
  onStartPickNow?: () => void;
  onReorderMiddle?: (newMiddle: WorkflowStep[]) => void;
  inProgress?: boolean;
  activeStepTitle?: string;
};

export function WorkflowTimeline({
  steps,
  onToggleDone,
  onStartPickNow,
  onReorderMiddle,
  inProgress = false,
  activeStepTitle,
}: Props) {
  const startStep = steps[0];
  const endStep = steps[steps.length - 1];
  const middleSteps = steps.filter((s) => s.kind === "step");
  const dragEnabled = !inProgress && !!onReorderMiddle;

  const handleDragEnd = ({ data }: { data: WorkflowStep[] }) => {
    onReorderMiddle?.(data);
  };

  const renderItem = ({ item, drag, isActive, getIndex }: RenderItemParams<WorkflowStep>) => {
    const isCurrentStep = inProgress && !!activeStepTitle && item.title === activeStepTitle;
    const dimmed = inProgress && item.kind === "step" && !isCurrentStep;
    return (
      <View style={styles.cardRow}>
        <WorkflowCard
          step={item}
          onToggleDone={onToggleDone}
          showStartButton={getIndex() === 0 && !!onStartPickNow && !inProgress}
          onStart={onStartPickNow}
          onDrag={dragEnabled ? drag : undefined}
          isActive={isActive}
          isCurrentStep={isCurrentStep}
          dimmed={dimmed}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.line} />
      <View style={styles.listWrap}>
        <View style={styles.cardRow}>
          <WorkflowCard step={startStep} onToggleDone={onToggleDone} />
        </View>
        <DraggableFlatList
          data={middleSteps}
          keyExtractor={(s) => s.id}
          onDragEnd={handleDragEnd}
          renderItem={renderItem}
          scrollEnabled={false}
          activationDistance={dragEnabled ? 10 : 9999}
        />
        <View style={styles.cardRow}>
          <WorkflowCard step={endStep} onToggleDone={onToggleDone} showStartButton={false} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    paddingHorizontal: 0,
    position: "relative",
  },
  line: {
    position: "absolute",
    left: "50%",
    marginLeft: -1,
    top: 36,
    bottom: 36,
    width: 2,
    backgroundColor: "#3A3A3C",
    borderRadius: 1,
  },
  listWrap: { zIndex: 1 },
  cardRow: { marginBottom: 4 },
});
