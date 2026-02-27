# Android AAB 빌드 및 Google Play 업로드 안내

Expo Managed workflow에서 Google Play 업로드용 **Android App Bundle(.aab)** 생성 방법입니다.

---

## 1. 사전 확인 (완료된 항목)

| 항목 | 상태 |
|------|------|
| eas-cli | ✅ 설치됨 (`npx eas --version`) |
| eas.json | ✅ production에 `android.buildType: "app-bundle"` 추가됨 |
| app.json android.package | ✅ `com.thinkflow.workflow` |
| app.json android.versionCode | ✅ `1` (업로드할 때마다 1씩 증가시키면 됨) |
| EAS 로그인 | ✅ `eas whoami`로 확인 가능 |

---

## 2. AAB 빌드 실행

**반드시 터미널에서 직접 실행**하세요. (최초 1회 키스토어 생성 시 확인 프롬프트가 뜹니다.)

```bash
cd c:\Users\jinseong\Desktop\StartNow\mobile
npx eas build -p android --profile production
```

- 처음이면 **"Generate a new Keystore?"** → **Yes** 입력.
- 빌드가 EAS 서버에서 진행되며, 완료까지 보통 10~20분 정도 걸립니다.

---

## 3. .aab 다운로드 위치

빌드가 끝나면:

1. 터미널에 **빌드 결과 URL**이 출력됩니다.  
   예: `https://expo.dev/accounts/<계정>/projects/thinkflow/builds/<build-id>`
2. 브라우저에서 해당 링크를 열거나, [expo.dev](https://expo.dev) → 로그인 → **Projects** → **ThinkFlow** → **Builds** 이동.
3. 완료된 Android 빌드 행에서 **Download** 버튼으로 **.aab** 파일 다운로드.

또는 터미널에서:

```bash
npx eas build:list --platform android --limit 1
```

에서 최신 빌드 ID를 확인한 뒤:

```bash
npx eas build:download --platform android --latest
```

로 최신 AAB를 받을 수 있습니다.

---

## 4. Play Console 업로드 방법

1. [Google Play Console](https://play.google.com/console) 접속 → 앱 선택(없으면 앱 만들기).
2. **출시** → **프로덕션** (또는 **내부 테스트** / **비공개 테스트**) → **새 버전 만들기**.
3. **앱 번들**에서 방금 받은 **.aab** 파일 업로드.
4. **버전 이름**에 `1.0.0 (1)` 등 표시용 이름 입력.
5. **저장** 후 **검토** → **출시 시작** (또는 **검토 단계로 이동**).

이후 업로드할 때마다 `app.json`의 `android.versionCode`를 2, 3, … 처럼 **이전보다 큰 정수**로 올린 뒤 다시 빌드하면 됩니다.

---

## 5. 오류 발생 시 해결 방법

| 오류 | 해결 |
|------|------|
| **Generate a new Keystore is not supported in --non-interactive** | `--non-interactive` 없이 터미널에서 `npx eas build -p android --profile production` 실행 후 프롬프트에서 Yes 선택. |
| **Not logged in** | `npx eas login` 실행 후 로그인. |
| **android.package not set** | `app.json` → `expo.android.package`에 예: `"com.thinkflow.workflow"` 설정. |
| **versionCode duplicate** | Play에 이미 올린 versionCode와 같으면 거부됨. `app.json`의 `android.versionCode`를 더 큰 숫자로 올려서 다시 빌드. |
| **Credentials error** | `npx eas credentials -p android` 로 키스토어/업로드 키 확인. 필요 시 재설정. |
| **Build failed (네트워크/서버)** | 잠시 후 다시 시도. [status.expo.dev](https://status.expo.dev) 에서 장애 여부 확인. |

---

## 6. 요약

- **빌드:** `npx eas build -p android --profile production` (터미널에서 실행).
- **다운로드:** expo.dev → 프로젝트 → Builds → 해당 빌드에서 .aab 다운로드.
- **업로드:** Play Console → 출시 → 앱 번들 업로드 → 출시 진행.
- **다음 버전:** `app.json`의 `android.versionCode` 증가 후 같은 명령으로 다시 빌드.
