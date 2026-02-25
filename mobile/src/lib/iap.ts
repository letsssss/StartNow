/**
 * IAP 서비스: react-native-iap 래퍼
 * - iOS 자동갱신 구독 productId: thinkflow.premium.monthly
 * - 추천: 결제/복원은 여기서만 처리하고, 구독 상태는 premium.tsx에서 캐시/전역 상태로 제공
 */
import { Platform } from "react-native";
import {
  initConnection as iapInitConnection,
  endConnection as iapEndConnection,
  getAvailablePurchases,
  requestPurchase,
  purchaseUpdatedListener,
  purchaseErrorListener,
  type Purchase,
  type PurchaseError,
} from "react-native-iap";

const SUBSCRIPTION_PRODUCT_ID = "thinkflow.premium.monthly";

/** 구독 상태 결과. 확실하지 않음: available purchases 존재만으로 판단하며, 추후 서버 영수증 검증/RevenueCat로 강화 가능 */
export type SubscriptionStatus = {
  isPremium: boolean;
  errorMessage?: string;
};

let purchaseResolve: ((p: Purchase) => void) | null = null;
let purchaseReject: ((e: string) => void) | null = null;

purchaseUpdatedListener((purchase: Purchase) => {
  if (purchase.productId === SUBSCRIPTION_PRODUCT_ID && purchaseResolve) {
    purchaseResolve(purchase);
    purchaseResolve = null;
    purchaseReject = null;
  }
});

purchaseErrorListener((err: PurchaseError) => {
  if (purchaseReject) {
    purchaseReject(err?.message ?? "결제 중 오류가 났어요.");
    purchaseResolve = null;
    purchaseReject = null;
  }
});

/** 앱에서 IAP 사용 종료 시 호출 (선택). 리스너는 앱 생명주기 동안 유지 */
export function endIAP(): Promise<void> {
  return iapEndConnection();
}

/**
 * 스토어 연결 초기화.
 * 추천: 앱 시작 시 1회 호출. Android는 flushFailedPurchases가 v14에 없어 생략(필요 시 네이티브 문서 참고)
 */
export async function initIAP(): Promise<boolean> {
  try {
    const ok = await iapInitConnection();
    if (Platform.OS === "android") {
      // flushFailedPurchasesCachedAsPendingAndroid: v14 export 없음. 필요 시 별도 확인
    }
    return ok;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn("[iap] initConnection failed:", msg);
    return false;
  }
}

/**
 * 현재 구독 상태 계산.
 * 추천: available purchases에 thinkflow.premium.monthly가 있으면 isPremium. 자동갱신 만료는 로컬에서 100% 검증 제한 있음 → 추후 서버/RevenueCat 검증 가능 주석 유지
 */
export async function getSubscriptionStatus(): Promise<SubscriptionStatus> {
  try {
    const purchases = await getAvailablePurchases({
      onlyIncludeActiveItemsIOS: true,
    });
    const isPremium = purchases.some(
      (p) => p.productId === SUBSCRIPTION_PRODUCT_ID
    );
    return { isPremium };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { isPremium: false, errorMessage: msg };
  }
}

let isPurchaseInProgress = false;

/**
 * 월간 구독 구매 요청. 중복 탭 방지.
 * 추천: 이벤트 기반이므로 리스너에서 resolve. 실패 시 사용자 친화 메시지 반환
 */
export function purchaseMonthly(): Promise<SubscriptionStatus> {
  if (isPurchaseInProgress) {
    return Promise.resolve({
      isPremium: false,
      errorMessage: "이미 처리 중이에요.",
    });
  }
  isPurchaseInProgress = true;

  const timeout = new Promise<SubscriptionStatus>((resolve) =>
    setTimeout(
      () => resolve({ isPremium: false, errorMessage: "결제 요청이 시간 초과됐어요. 다시 시도해 주세요." }),
      120000
    )
  );

  const purchasePromise = new Promise<SubscriptionStatus>((resolve, reject) => {
    purchaseResolve = (p: Purchase) => {
      isPurchaseInProgress = false;
      resolve({ isPremium: p.productId === SUBSCRIPTION_PRODUCT_ID });
    };
    purchaseReject = (msg: string) => {
      isPurchaseInProgress = false;
      resolve({ isPremium: false, errorMessage: msg });
    };
    requestPurchase({
      request: {
        apple: { sku: SUBSCRIPTION_PRODUCT_ID },
        google: { skus: [SUBSCRIPTION_PRODUCT_ID] },
      },
      type: "subscription",
    }).catch((e) => {
      isPurchaseInProgress = false;
      const msg = e instanceof Error ? e.message : String(e);
      resolve({ isPremium: false, errorMessage: msg });
    });
  });

  return Promise.race([purchasePromise, timeout]).finally(() => {
    isPurchaseInProgress = false;
  });
}

/**
 * 구매 복원: getAvailablePurchases 재호출 후 isPremium 반환.
 */
export async function restore(): Promise<SubscriptionStatus> {
  return getSubscriptionStatus();
}
