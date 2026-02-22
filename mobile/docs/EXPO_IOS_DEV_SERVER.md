# iOS "Could not connect to development server" 해결 (Expo SDK 54)

Windows PC에서 `StartNow/mobile`을 실행하고, iOS 기기/시뮬레이터에서 `192.168.0.2:8083` 등으로 접속이 실패할 때 참고용 가이드입니다.

---

## 1) Expo Go vs Dev Client 구분

| 확인 방법 | Expo Go | Dev Client(커스텀 빌드) |
|-----------|--------|--------------------------|
| **앱 설치 경로** | App Store에서 "Expo Go" 설치 | 직접 빌드한 .ipa / 개발 빌드 앱 |
| **package.json** | `expo-dev-client` 없음 ✅ (현재 프로젝트) | `expo-dev-client` 있음 |
| **실행 후 첫 화면** | QR 스캔/URL 입력 화면 | "Development servers" 목록 또는 로그인 |

**현재 StartNow/mobile**: `expo-dev-client` 미설치 → **Expo Go** 사용 중입니다.

---

## 2) 실행 커맨드 (Expo SDK 54, npm)

프로젝트 루트: `StartNow/mobile`

| 목적 | 커맨드 | 비고 |
|------|--------|------|
| **기본(LAN)** | `npx expo start` | 같은 Wi‑Fi에서 PC IP(예: 192.168.0.2)로 접속 시도 |
| **LAN 명시** | `npx expo start --lan` | 위와 동일, LAN 모드만 명시 |
| **방화벽/공유기 문제 시** | `npx expo start --tunnel` | ngrok 터널로 URL 발급, **가장 확실** |
| **캐시 초기화 후** | `npx expo start -c` | 번들 캐시 지우고 시작 (포트/설정 꼬였을 때 유용) |
| **iOS 시뮬레이터만** | `npx expo start --ios` | 시뮬레이터는 localhost로 접속해 LAN 이슈 없음 |

- **실기기 + LAN**: `npx expo start` 또는 `npx expo start --lan`
- **실기기에서 계속 실패**: `npx expo start --tunnel` 사용 후 터미널에 나온 URL(또는 QR)로 접속
- **React Native CLI만**: `npx react-native start`는 Expo 관리 프로젝트에서는 보통 쓰지 않음 (Expo가 Metro를 띄움).

---

## 3) 방화벽 / 같은 Wi‑Fi / 포트 점검

### 3-1. 같은 Wi‑Fi

- PC와 iPhone이 **동일한 Wi‑Fi**에 연결돼 있는지 확인.
- 게스트/격리 네트워크면 기기 간 통신이 막힐 수 있음.

### 3-2. Windows 방화벽

- **인바운드**에서 **Node / Metro / Expo** 관련 허용:
  - 실행 중인 `node.exe` (Expo/Metro) 허용.
  - 또는 개발용으로 **개인 네트워크**에서 포트 **8081, 8083, 19000, 19001** TCP 인바운드 허용.
- PowerShell(관리자):
  ```powershell
  New-NetFirewallRule -DisplayName "Expo Metro" -Direction Inbound -Protocol TCP -LocalPort 8081,8083,19000,19001 -Action Allow -Profile Private
  ```
- 기존 규칙이 있으면 위 포트가 "허용"인지 확인.

### 3-3. 포트 충돌

- 8083(또는 8081)을 다른 앱이 쓰고 있으면 Expo가 다른 포트를 쓰거나 연결이 꼬일 수 있음.
- 확인:
  ```powershell
  netstat -ano | findstr "8083"
  netstat -ano | findstr "8081"
  ```
- 사용 중인 프로세스 종료 후 `npx expo start -c`로 다시 시도.

### 3-4. PC IP 확인

- 터미널에 찍힌 URL이 `192.168.0.2:8083`인데, PC IP가 바뀌었을 수 있음.
- PowerShell: `Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notmatch "Loopback" }`
- PC IP가 예전과 다르면 **고정 IP를 쓰지 말고** 아래 "재발 방지"대로 tunnel 또는 매번 터미널에 찍힌 주소를 사용.

---

## 4) 재발 방지 (고정 IP 말고 자동으로)

- **권장**: 실기기 개발 시 **`npx expo start --tunnel`** 사용.  
  - 터미널에 나오는 `https://xxx.ngrok.io` 같은 URL만 쓰면, PC IP/방화벽/포트와 무관하게 접속 가능.
- **LAN을 쓸 때**:
  - `.env`에 **Metro/Expo dev server용**으로 고정 IP를 넣지 말 것.  
  - 현재 `.env`의 `EXPO_PUBLIC_API_BASE_URL=http://192.168.0.2:3000`는 **API 서버용**이므로, dev server(8083)와는 별개.  
  - dev server 주소는 Expo가 자동으로 잡은 IP를 쓰게 두고, 터미널에 출력되는 URL/QR만 사용.
- **매번 IP가 바뀌는 환경**:  
  - tunnel 사용이 가장 안정적.  
  - 또는 실행할 때마다 터미널에 찍힌 `exp://192.168.x.x:8083` 같은 주소를 Expo Go에 수동 입력.

---

## 5) 한 번에 따라 할 체크리스트

1. **Expo Go**로 연결하는지 확인 (앱 이름이 "Expo Go").
2. PC에서: `cd StartNow/mobile` → `npx expo start -c` (한 번 캐시 초기화).
3. **iOS 시뮬레이터**만 쓸 경우: `npx expo start --ios` 로 실행.
4. **실기기**에서 LAN이 안 되면: `npx expo start --tunnel` → 나온 URL/QR로 접속.
5. 방화벽에서 8081/8083(및 19000, 19001) TCP 인바운드 허용.
6. PC와 iPhone이 같은 Wi‑Fi인지 확인.
7. dev server 주소를 고정 IP로 덮어쓰지 말고, 터미널에 찍힌 주소 사용 또는 tunnel 사용.

이렇게 하면 "Could not connect to development server (192.168.0.2:8083)" 오류 원인을 확정하고, Expo SDK 54 기준으로 올바른 실행/네트워크 설정을 유지할 수 있습니다.
