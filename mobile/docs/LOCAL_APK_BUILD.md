# 로컬에서 Android APK 빌드 (EAS 대기 없이 5분 내 테스트)

Expo Managed 프로젝트에서 `expo prebuild` 후 Gradle로 **로컬에서 바로** debug APK를 만드는 방법입니다.  
production/EAS 빌드 구조는 건드리지 않습니다.

---

## 전제

- **Android Studio** 설치됨 (없으면 아래 "Android Studio 없을 때" 참고)
- **mobile** 폴더가 Expo 프로젝트 루트

---

## 1) 네이티브 프로젝트 생성

```powershell
cd C:\Users\jinseong\Desktop\StartNow\mobile
npx expo prebuild -p android
```

- **android** 폴더가 생성/갱신되면 성공.
- 이미 있으면 재사용됩니다.

---

## 2) JAVA_HOME 설정 (필수)

Gradle이 Java를 쓰므로 **JAVA_HOME**이 필요합니다.

**Android Studio를 쓰는 경우** (보통 여기 있는 JDK 사용):

- 예시 경로:  
  `C:\Program Files\Android\Android Studio\jbr`  
  또는 `C:\Program Files\Android\Android Studio\jre`
- PowerShell에서 **이번 세션만**:

  ```powershell
  $env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
  ```

- 영구 설정:  
  **시스템 속성 → 고급 → 환경 변수**에서  
  새 사용자/시스템 변수 `JAVA_HOME` = 위 경로로 추가.

**Android Studio가 없을 때:**

- [Oracle JDK 17](https://www.oracle.com/java/technologies/downloads/#jdk17-windows) 또는 [Eclipse Temurin 17](https://adoptium.net/) 설치 후  
  `JAVA_HOME`을 해당 JDK 설치 경로로 설정.

---

## 3) Debug APK 빌드

```powershell
cd C:\Users\jinseong\Desktop\StartNow\mobile\android
.\gradlew.bat assembleDebug
```

- 처음 실행 시 의존성 다운로드로 2~5분 걸릴 수 있음.
- 끝나면 아래 경로에 APK가 생성됩니다.

---

## 4) 생성된 APK 경로

- **경로:**  
  `mobile\android\app\build\outputs\apk\debug\app-debug.apk`
- 전체 예:  
  `C:\Users\jinseong\Desktop\StartNow\mobile\android\app\build\outputs\apk\debug\app-debug.apk`

---

## 5) 폰에 설치하는 방법

1. **APK를 폰으로 옮기기**  
   USB 연결 후 위 파일을 폰 저장공간에 복사하거나,  
   이메일/드라이브/메신저로 보내서 폰에서 받기.

2. **폰에서 설치**  
   파일 관리자(또는 다운로드 앱)에서 `app-debug.apk` 선택 후 설치.  
   “출처를 알 수 없는 앱” 허용이 필요하면 설정에서 허용.

3. **(선택) adb 사용**  
   PC에 adb가 있고 USB 디버깅이 켜져 있으면:
   ```powershell
   adb install -r "C:\Users\jinseong\Desktop\StartNow\mobile\android\app\build\outputs\apk\debug\app-debug.apk"
   ```

---

## 환경 변수 (API 주소) 안내

- `npx expo prebuild` 시점에 **mobile/.env** 의 `EXPO_PUBLIC_API_BASE_URL` 이 번들에 반영됩니다.
- 로컬에서 **테스트용 API 주소**를 쓰려면,  
  prebuild **전에** `mobile/.env` 에 원하는 URL을 넣고 prebuild → `assembleDebug` 순서로 진행하세요.
- EAS Production env는 **로컬 Gradle 빌드에는 적용되지 않습니다.**  
  로컬 APK = .env 기준.

---

## 요약

| 단계 | 명령/작업 |
|------|------------|
| 1 | `cd mobile` → `npx expo prebuild -p android` |
| 2 | JAVA_HOME 설정 (Android Studio `jbr` 또는 JDK 17) |
| 3 | `cd android` → `.\gradlew.bat assembleDebug` |
| 4 | APK: `android\app\build\outputs\apk\debug\app-debug.apk` |
| 5 | APK를 폰으로 복사 후 실행해 설치 |

production/EAS 빌드는 그대로 두고, 위 절차는 **로컬 테스트용 APK** 전용입니다.
