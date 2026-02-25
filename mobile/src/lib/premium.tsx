/**
 * 전역 프리미엄 상태: 캐시 + IAP 연동
 * 추천: UI 반응을 위해 캐시를 먼저 적용하고, 백그라운드에서 재검증
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState, AppStateStatus } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as iap from "./iap";

const CACHE_KEY = "thinkflow_premium_cache";
const FOREGROUND_COOLDOWN_MS = 15000;

type PremiumContextValue = {
  isPremium: boolean;
  loading: boolean;
  lastCheckedAt: number | null;
  refreshPremium: () => Promise<void>;
  purchaseMonthly: () => Promise<{ success: boolean; message?: string }>;
  restorePurchases: () => Promise<{ success: boolean; message?: string }>;
};

const PremiumContext = createContext<PremiumContextValue | null>(null);

export function PremiumProvider({ children }: { children: React.ReactNode }) {
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastCheckedAt, setLastCheckedAt] = useState<number | null>(null);
  const initDone = useRef(false);

  const refreshPremium = useCallback(async () => {
    if (!initDone.current) {
      initDone.current = true;
      await iap.initIAP();
    }
    const { isPremium: premium, errorMessage } =
      await iap.getSubscriptionStatus();
    setIsPremium(premium);
    setLastCheckedAt(Date.now());
    try {
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ isPremium: premium }));
    } catch {}
  }, []);

  const purchaseMonthly = useCallback(async () => {
    const result = await iap.purchaseMonthly();
    await refreshPremium();
    if (result.isPremium) return { success: true };
    return {
      success: false,
      message: result.errorMessage ?? "결제를 완료하지 못했어요. 다시 시도해 주세요.",
    };
  }, [refreshPremium]);

  const restorePurchases = useCallback(async () => {
    const result = await iap.restore();
    await refreshPremium();
    if (result.isPremium) return { success: true };
    return {
      success: false,
      message: result.errorMessage ?? "복원할 구매 내역이 없어요.",
    };
  }, [refreshPremium]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(CACHE_KEY);
        if (raw && !cancelled) {
          const parsed = JSON.parse(raw) as { isPremium?: boolean };
          if (typeof parsed.isPremium === "boolean") {
            setIsPremium(parsed.isPremium);
          }
        }
      } catch {}
      if (!cancelled) await refreshPremium();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshPremium]);

  useEffect(() => {
    const sub = AppState.addEventListener(
      "change",
      (state: AppStateStatus) => {
        if (state !== "active") return;
        const now = Date.now();
        if (lastCheckedAt != null && now - lastCheckedAt < FOREGROUND_COOLDOWN_MS)
          return;
        refreshPremium();
      }
    );
    return () => sub.remove();
  }, [lastCheckedAt, refreshPremium]);

  const value: PremiumContextValue = {
    isPremium,
    loading,
    lastCheckedAt,
    refreshPremium,
    purchaseMonthly,
    restorePurchases,
  };

  return (
    <PremiumContext.Provider value={value}>{children}</PremiumContext.Provider>
  );
}

export function usePremium(): PremiumContextValue {
  const ctx = useContext(PremiumContext);
  if (!ctx) throw new Error("usePremium must be used within PremiumProvider");
  return ctx;
}
