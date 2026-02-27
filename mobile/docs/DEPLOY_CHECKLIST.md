# ThinkFlow 배포 전 체크리스트

배포 전에 아래 항목을 확인하세요.

---

## 1. 앱(Expo/EAS)

### 1.1 앱 설정 (`mobile/app.json`)
- [x] `name`, `slug`, `version` (현재 1.0.0)
- [x] iOS `bundleIdentifier`: `com.thinkflow.workflow`
- [x] Android `package`: `com.thinkflow.workflow`
- [x] `extra.eas.projectId` 설정됨
- [ ] 필요 시 버전/빌드 번호 올리기 (스토어 제출 전)

### 1.2 EAS Build (`mobile/eas.json`)
- [x] `production` 프로필: iOS `distribution: "store"`
- [ ] **Android**: 현재 `production`에 Android 프로필 없음. Android 스토어 배포 시 `android: { buildType: "apk" }` 또는 앱 번들 설정 추가 필요
- [x] `submit.production.ios.ascAppId`: 6759628291

### 1.3 인앱 결제 (IAP)
- [ ] **App Store Connect**: 구독 상품 `thinkflow.premium.monthly` 생성·승인
- [ ] **Google Play Console**: 동일 product ID 구독 상품 등록 (Android 출시 시)
- [ ] 샌드박스/테스트 결제로 구매·복원 흐름 확인

---

## 2. 백엔드(API)

### 2.1 환경 변수
- [ ] 배포 서버에 `OPENAI_API_KEY` 설정 (필수)
- [ ] 선택: `OPENAI_MODEL` (기본값: gpt-4o-mini)

### 2.2 API 서버 배포
- [ ] API 호스팅 결정 (Vercel, Railway, AWS 등). 현재 `api`는 Next.js 기반
- [ ] API 배포 후 **실제 서버 URL** 확인 (예: `https://api.thinkflow.xxx.com`)

### 2.3 앱 → API 연결
- [ ] **프로덕션 빌드**에 사용할 API URL 결정
- [ ] EAS 빌드 시 `EXPO_PUBLIC_API_BASE_URL`를 프로덕션 URL로 설정  
  (예: `eas build --profile production` 전에 `.env` 또는 EAS Secrets에 설정)
- [ ] 현재 `.env.example`은 로컬 개발용(`http://192.168.x.x:3000`) — 배포용 URL과 구분 필요

---

## 3. 정책·법적

### 3.1 개인정보처리방침
- [x] `privacy-policy/index.html` 있음
- [ ] **GitHub Pages** 등으로 공개 후 URL 확인  
  예: `https://letsssss.github.io/StartNow/privacy-policy/`
- [x] Paywall 화면에서 "개인정보처리방침" 링크 연결됨

### 3.2 이용약관
- [ ] 이용약관 페이지 필요 시 작성 후 URL 연결 (현재 Paywall "이용약관"은 `onPress` 빈 상태)

### 3.3 스토어
- [ ] **App Store**: 개인정보처리방침 URL, 앱 설명, 스크린샷 등 입력
- [ ] **Google Play**: 개인정보처리방침 URL 등록 (정책 → 앱 콘텐츠)

---

## 4. 기능·품질

### 4.1 무료/프리미엄 정책
- [ ] **InputScreen**에 TODO: "무료 제한 정책 적용" — 정책 확정 후 구현 (예: 단계 수 제한, 저장 제한)
- [ ] Paywall 문구(7일 무료, 월/연 가격)와 스토어 상품 설명 일치 여부 확인

### 4.2 테스트
- [ ] iOS 실기기에서 구조화 → 결과 화면 → 히스토리·프리미엄 플로우 테스트
- [ ] API 연동(실제 또는 스테이징 URL)으로 오류 없이 동작하는지 확인

---

## 5. 빠른 체크 요약

| 항목 | 상태 |
|------|------|
| iOS production 빌드 프로필 | ✅ 있음 |
| Android production 빌드 | ⚠️ eas.json에 없음 (Android 출시 시 추가) |
| IAP 상품 ID (thinkflow.premium.monthly) | ⚠️ 스토어에 등록 필요 |
| API 서버 배포 및 URL | ⚠️ 배포 후 EXPO_PUBLIC_API_BASE_URL 설정 |
| OPENAI_API_KEY (API 서버) | ⚠️ 배포 환경에 설정 |
| 개인정보처리방침 링크 | ✅ Paywall에서 연결됨 |
| 이용약관 링크 | ⚠️ 미연결 (페이지 있으면 URL 연결) |
| 무료 제한 정책 | ⚠️ TODO 상태 — 선택 사항 |

---

배포 순서 제안:
1. API 서버 배포 → `EXPO_PUBLIC_API_BASE_URL` 확정  
2. GitHub Pages로 개인정보처리방침 공개 (이미 연결됨)  
3. App Store Connect에 구독 상품 등록  
4. `eas build --profile production` (iOS) 후 submit  
5. 무료 제한 정책이 필요하면 InputScreen 로직 추가 후 재배포
