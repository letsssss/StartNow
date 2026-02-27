import Constants from "expo-constants";

const extra = Constants.expoConfig?.extra as { apiBaseUrl?: string } | undefined;
const raw = extra?.apiBaseUrl ?? "";
const apiBaseUrl = typeof raw === "string" ? raw.trim() : "";

function ensureApiBaseUrl(): string {
  if (__DEV__ && !apiBaseUrl) {
    console.error(
      "[config/api] apiBaseUrl이 비어 있습니다. .env에 EXPO_PUBLIC_API_BASE_URL을 설정하고 'npx expo start -c'로 재시작하세요. EAS Build면 eas.json 해당 프로필의 env에 값을 넣거나 EAS Secret을 설정하세요."
    );
  }
  if (!apiBaseUrl) {
    throw new Error(
      "EXPO_PUBLIC_API_BASE_URL is not set. Set it in .env and restart with: npx expo start -c (or set in EAS Build env/secret)."
    );
  }
  return apiBaseUrl;
}

/** API 베이스 URL (빈 문자열일 수 있음). 표시/로그용. */
export function getApiBaseUrl(): string {
  if (__DEV__ && !apiBaseUrl) {
    console.warn(
      "[config/api] apiBaseUrl 없음. mobile/.env에 EXPO_PUBLIC_API_BASE_URL=http://PC_IP:3000 설정 후 'npx expo start -c'"
    );
  }
  return apiBaseUrl;
}

/** 네트워크 호출용. 비어 있으면 개발 시 경고 후 예외. */
export function getApiBaseUrlOrThrow(): string {
  return ensureApiBaseUrl();
}
