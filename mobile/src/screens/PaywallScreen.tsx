import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";
import { usePremium } from "../lib/premium";

const MAX_CONTENT_WIDTH = 340;

type Props = NativeStackScreenProps<RootStackParamList, "Paywall">;

const PRIVACY_POLICY_URL = "https://letsssss.github.io/StartNow/privacy-policy/";

export function PaywallScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("yearly");
  const { purchaseMonthly, restorePurchases } = usePremium();
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const handleStartPremium = async () => {
    if (purchasing) return;
    setPurchasing(true);
    try {
      // 추천: purchaseMonthly가 성공하면 전역 isPremium 갱신 후 Paywall 닫기
      const { success, message } = await purchaseMonthly();
      if (success) {
        navigation.goBack();
      } else {
        Alert.alert("안내", message ?? "결제를 완료하지 못했어요. 다시 시도해 주세요.");
      }
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    if (restoring) return;
    setRestoring(true);
    try {
      const { success, message } = await restorePurchases();
      if (success) {
        Alert.alert("안내", "복원이 완료됐어요.");
        navigation.goBack();
      } else {
        Alert.alert("안내", message ?? "복원할 구매 내역이 없어요.");
      }
    } finally {
      setRestoring(false);
    }
  };

  const handleLater = () => {
    navigation.goBack();
  };

  const openPrivacyPolicy = () => {
    Linking.openURL(PRIVACY_POLICY_URL).catch(() =>
      Alert.alert("안내", "링크를 열 수 없어요.")
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.crownBox}>
            <Text style={styles.crownIcon}>👑</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>7일 무료 체험</Text>
          </View>
          <Text style={styles.headline}>
            생각을 단계로 바꾸는 가장 빠른 방법
          </Text>
          <Text style={styles.subtext}>
            중간 저장, 무제한 기록, 더 긴 워크플로우까지.
          </Text>
        </View>

        {/* Plans */}
        <View style={styles.planRow}>
          <TouchableOpacity
            style={[
              styles.planCard,
              selectedPlan === "monthly" && styles.planCardSelected,
            ]}
            onPress={() => setSelectedPlan("monthly")}
            activeOpacity={0.8}
          >
            <Text style={styles.planLabel}>월간</Text>
            <Text style={styles.planPrice}>₩4,900</Text>
            <Text style={styles.planPeriod}>/ 월</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.planCard,
              styles.planCardYearly,
              selectedPlan === "yearly" && styles.planCardSelected,
            ]}
            onPress={() => setSelectedPlan("yearly")}
            activeOpacity={0.8}
          >
            <View style={styles.popularBadge}>
              <Text style={styles.popularBadgeText}>가장 인기</Text>
            </View>
            <Text style={styles.planLabel}>연간</Text>
            <Text style={styles.planPrice}>₩39,000</Text>
            <Text style={styles.planPeriod}>/ 년</Text>
            <Text style={styles.planNoteHighlight}>약 34% 절약</Text>
          </TouchableOpacity>
        </View>

        {/* Features - 2열 그리드 */}
        <View style={styles.featureGrid}>
          <View style={styles.featureRow}>
            <View style={styles.featureCell}>
              <Text style={styles.featureIcon}>⚡</Text>
              <Text style={styles.featureLabel} numberOfLines={2}>4단계 이상 실행 가능</Text>
            </View>
            <View style={styles.featureCell}>
              <Text style={styles.featureIcon}>👑</Text>
              <Text style={styles.featureLabel} numberOfLines={2}>저장/히스토리 무제한</Text>
            </View>
          </View>
          <View style={styles.featureRow}>
            <View style={styles.featureCell}>
              <Text style={styles.featureIcon}>✨</Text>
              <Text style={styles.featureLabel} numberOfLines={2}>캘린더에서 즉시 복원</Text>
            </View>
            <View style={styles.featureCell}>
              <Text style={styles.featureIcon}>🛡️</Text>
              <Text style={styles.featureLabel} numberOfLines={2}>광고 없음</Text>
            </View>
          </View>
        </View>

        {/* CTA */}
        <View style={styles.ctaSection}>
        <TouchableOpacity
          style={[styles.ctaButton, purchasing && styles.ctaButtonDisabled]}
          onPress={handleStartPremium}
          disabled={purchasing}
          activeOpacity={0.88}
        >
          <Text style={styles.ctaIcon}>✨</Text>
          <Text style={styles.ctaText}>
            {purchasing ? "처리 중..." : "프리미엄 시작하기"}
          </Text>
        </TouchableOpacity>
          <TouchableOpacity
            style={styles.laterButton}
            onPress={handleLater}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.laterText}>나중에</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.legal}>
            구독은 자동 갱신되며 언제든 취소할 수 있습니다.
          </Text>
          <TouchableOpacity
            onPress={handleRestore}
            disabled={restoring}
            style={styles.restoreButton}
          >
            {/* 추천: 복원 후 isPremium이 true면 사용자에게 안내 후 Paywall 닫기 */}
            <Text style={styles.restoreText}>
              {restoring ? "복원 중..." : "구매 복원"}
            </Text>
          </TouchableOpacity>
          <View style={styles.legalLinks}>
            <TouchableOpacity onPress={() => {}}>
              <Text style={styles.legalLink}>이용약관</Text>
            </TouchableOpacity>
            <Text style={styles.legalSlash}>/</Text>
            <TouchableOpacity onPress={openPrivacyPolicy}>
              <Text style={styles.legalLink}>개인정보처리방침</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    paddingHorizontal: 20,
    paddingBottom: 24,
    alignItems: "center",
  },
  hero: {
    alignItems: "center",
    marginTop: 24,
    marginBottom: 20,
  },
  crownBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "rgba(0,194,168,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  crownIcon: {
    fontSize: 28,
  },
  badge: {
    backgroundColor: "rgba(0,194,168,0.15)",
    borderWidth: 1,
    borderColor: "rgba(0,194,168,0.35)",
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#00C2A8",
  },
  headline: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    lineHeight: 26,
    maxWidth: MAX_CONTENT_WIDTH,
    marginBottom: 8,
  },
  subtext: {
    fontSize: 14,
    color: "rgba(255,255,255,0.65)",
    textAlign: "center",
    lineHeight: 20,
    maxWidth: MAX_CONTENT_WIDTH,
  },
  planRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    maxWidth: MAX_CONTENT_WIDTH,
    marginBottom: 20,
  },
  planCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.12)",
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 2,
    minWidth: 0,
  },
  planCardYearly: {
    position: "relative",
    backgroundColor: "rgba(0,194,168,0.05)",
  },
  planCardSelected: {
    borderColor: "#00C2A8",
  },
  popularBadge: {
    position: "absolute",
    top: -10,
    alignSelf: "center",
    backgroundColor: "#00C2A8",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  popularBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#fff",
  },
  planLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#fff",
  },
  planPrice: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  planPeriod: {
    fontSize: 12,
    color: "rgba(255,255,255,0.55)",
  },
  planNoteHighlight: {
    fontSize: 11,
    fontWeight: "600",
    color: "#00C2A8",
    marginTop: 4,
  },
  featureGrid: {
    flexDirection: "column",
    width: "100%",
    maxWidth: MAX_CONTENT_WIDTH,
    gap: 8,
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: "row",
    gap: 8,
  },
  featureCell: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 8,
    minWidth: 0,
  },
  featureIcon: {
    fontSize: 16,
  },
  featureLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: "500",
    color: "#fff",
  },
  ctaSection: {
    width: "100%",
    maxWidth: MAX_CONTENT_WIDTH,
    marginBottom: 16,
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#00C2A8",
    height: 40,
    paddingHorizontal: 20,
    borderRadius: 10,
    width: "100%",
    gap: 8,
  },
  ctaIcon: {
    fontSize: 16,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  laterButton: {
    alignItems: "center",
    paddingVertical: 8,
    marginTop: 8,
  },
  laterText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
  },
  ctaButtonDisabled: { opacity: 0.7 },
  footer: {
    width: "100%",
    maxWidth: MAX_CONTENT_WIDTH,
    alignItems: "center",
  },
  legal: {
    fontSize: 11,
    color: "rgba(255,255,255,0.45)",
    textAlign: "center",
    lineHeight: 16,
  },
  restoreButton: {
    marginTop: 8,
    paddingVertical: 4,
  },
  restoreText: {
    fontSize: 11,
    color: "#00C2A8",
    textDecorationLine: "underline",
  },
  legalLinks: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    gap: 12,
  },
  legalLink: {
    fontSize: 11,
    color: "rgba(255,255,255,0.4)",
    textDecorationLine: "underline",
  },
  legalSlash: {
    fontSize: 11,
    color: "rgba(255,255,255,0.35)",
  },
});
