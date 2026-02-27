# 서버 연결 실패 해결 (워크플로우 생성 시)

워크플로우 생성 버튼을 누르면 **"서버 연결 실패"** 가 뜨는 경우, 앱이 API 서버(`/api/structure`)에 접속하지 못한 상태입니다.

---

## 원인

- 앱은 **`EXPO_PUBLIC_API_BASE_URL`** 에 설정된 주소로 API를 호출합니다.
- 해당 주소에 API 서버가 없거나, 주소가 잘못되었거나, 네트워크/방화벽 때문에 연결이 되지 않으면 **서버 연결 실패**가 납니다.

---

## 로컬 개발에서 해결 (PC + 같은 Wi‑Fi의 폰/에뮬레이터)

### 1. API 서버 실행

API(Next.js)를 **PC에서** 실행해 두어야 합니다.

```bash
cd c:\Users\jinseong\Desktop\StartNow\api
npm run dev
```

- 기본 포트: **3000** (브라우저에서 http://localhost:3000 확인)

### 2. PC IP 확인

- **Windows**: `cmd`에서 `ipconfig` 실행 → **IPv4 주소** 확인 (예: `192.168.0.2`)
- 이 주소가 앱이 접속할 **API 서버 주소**가 됩니다.

### 3. mobile/.env 설정

`mobile` 폴더에 `.env` 파일이 있어야 하고, 아래 한 줄이 **실제 PC IP**로 들어가 있어야 합니다.

```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.0.2:3000
```

- `192.168.0.2`를 **위에서 확인한 PC IPv4 주소**로 바꿉니다.
- API를 다른 포트(예: 3001)로 띄웠다면 `:3000` 대신 `:3001`로 수정합니다.

`.env`가 없으면:

```bash
cd c:\Users\jinseong\Desktop\StartNow\mobile
copy .env.example .env
```

이후 `.env`를 열어 `EXPO_PUBLIC_API_BASE_URL` 값을 PC IP로 수정합니다.

### 4. 앱 재시작 (필수)

`.env`를 바꾼 뒤에는 **반드시** Expo를 다시 띄워야 합니다. 환경 변수는 빌드/번들 시점에만 들어갑니다.

```bash
cd c:\Users\jinseong\Desktop\StartNow\mobile
npx expo start -c
```

`-c`는 캐시 없이 시작해서, 예전 URL이 남지 않게 합니다.

### 5. 확인할 것

| 확인 항목 | 설명 |
|-----------|------|
| **API 서버 실행** | `api` 폴더에서 `npm run dev` 후 http://localhost:3000 접속 가능한지 |
| **같은 Wi‑Fi** | 폰과 PC가 같은 공유기에 연결돼 있는지 |
| **방화벽** | Windows 방화벽에서 **인바운드** 포트 3000 허용 (또는 개발 시 임시로 비활성화 후 테스트) |
| **.env 반영** | `EXPO_PUBLIC_API_BASE_URL` 수정 후 **반드시** `npx expo start -c` 로 재시작 |

---

## 실기기에서만 안 될 때

- **localhost / 127.0.0.1** 은 기기 자신을 가리키므로 사용하면 안 됩니다.
- 반드시 **PC의 실제 IP**(예: `192.168.0.2`)를 `EXPO_PUBLIC_API_BASE_URL`에 넣고, 위 1~5를 모두 확인하세요.

---

## 프로덕션(스토어 빌드)에서 해결

- 스토어에 낸 앱은 **배포된 API 서버 URL**로만 접속할 수 있습니다.
- **EAS 빌드** 시 `EXPO_PUBLIC_API_BASE_URL`을 **배포된 API 주소**(예: `https://api.thinkflow.xxx.com`)로 설정해야 합니다.
  - EAS 대시보드 → 프로젝트 → **Environment variables** (production)에  
    `EXPO_PUBLIC_API_BASE_URL` = `https://실제API주소` 추가
  - 또는 빌드 전에 `mobile/.env`에 프로덕션 URL 넣고 빌드 (보통은 EAS 환경 변수 사용 권장)
- 그 전에 **API 서버를 실제 서버에 배포**하고, 해당 URL이 브라우저/폰에서 접속 가능한지 확인해야 합니다.

---

## 요약

1. **API 서버** 실행 (`api` 폴더에서 `npm run dev`).
2. **PC IP** 확인 (`ipconfig` → IPv4).
3. **mobile/.env** 에 `EXPO_PUBLIC_API_BASE_URL=http://PC_IP:3000` 설정.
4. **`npx expo start -c`** 로 앱 재시작 후 다시 워크플로우 생성 시도.

이렇게 해도 "서버 연결 실패"가 나오면, 터미널의 `[apiClient]` 로그와 `[structure]` 로그를 확인해 요청 URL과 에러 메시지를 보면 원인 파악에 도움이 됩니다.
