# EAS 로컬 빌드 셋업 (대기열 0초, Managed 유지)

EAS 클라우드 대기 없이 **로컬에서 APK 빌드**하고 **adb로 로그 확인**할 수 있게 하는 최소 설정입니다.  
prebuild 없이 **EAS local build**만 사용합니다.

---

## 1) Android Studio 설치 후 최소 설정

### 1.1 설치

- https://developer.android.com/studio 에서 다운로드 후 설치.
- 설치 시 **Android SDK**, **Android SDK Platform-Tools** 는 기본 선택된 상태로 진행.

### 1.2 환경 변수 (한 번만 설정)

| 변수 | 값 (예시) | 필수 |
|------|------------|------|
| **JAVA_HOME** | `C:\Program Files\Android\Android Studio\jbr` | ✅ 필수 |
| **ANDROID_HOME** | `C:\Users\jinseong\AppData\Local\Android\Sdk` | 선택(권장) |
| **Path** 에 추가 | `%ANDROID_HOME%\platform-tools` (또는 `C:\Users\...\Android\Sdk\platform-tools`) | ✅ 필수 (adb용) |

**설정 방법 (Windows):**

1. **시스템 속성** → **고급** → **환경 변수**
2. **사용자 변수** 또는 **시스템 변수**에서 **새로 만들기**:
   - 변수 이름: `JAVA_HOME`  
     변수 값: `C:\Program Files\Android\Android Studio\jbr`
   - 변수 이름: `ANDROID_HOME`  
     변수 값: `C:\Users\jinseong\AppData\Local\Android\Sdk`  
     (실제 경로는 Android Studio **Settings → Android SDK** 에서 확인)
3. **Path** 선택 → **편집** → **새로 만들기** →  
   `%ANDROID_HOME%\platform-tools` 또는  
   `C:\Users\jinseong\AppData\Local\Android\Sdk\platform-tools`  
   추가 후 확인.
4. **모든 터미널/IDE를 닫았다가 다시 연다.**

---

## 2) PATH에 platform-tools 추가 확인

- 위에서 **Path**에 `platform-tools` 를 넣었으면 됨.
- 새 PowerShell에서 `adb version` 이 동작하면 정상.

---

## 3) ANDROID_HOME (선택)

- EAS local build는 보통 **Android SDK 경로**를 찾을 때 사용.
- 설정해 두면 NDK/SDK 경로 문제를 줄일 수 있어 **권장**.
- 값: Android Studio에서 **Settings → Android SDK** 상단에 나오는 **Android SDK Location** (예: `C:\Users\사용자명\AppData\Local\Android\Sdk`).

---

## 4) java / adb 동작 확인

**새 PowerShell**에서:

```powershell
java -version
```

- `openjdk version "17"` 등이 나오면 OK.

```powershell
adb version
```

- 버전 정보가 나오면 OK.

```powershell
echo $env:JAVA_HOME
echo $env:ANDROID_HOME
```

- 설정한 경로가 출력되면 OK.

---

## 5) EAS 로컬 빌드 (prebuild 없이)

**mobile** 폴더에서:

```powershell
cd C:\Users\jinseong\Desktop\StartNow\mobile
eas build -p android --profile preview-apk --local
```

- **prebuild는 하지 않음.** EAS가 로컬에서 네이티브 빌드를 수행.
- `preview-apk` 프로필: `distribution: internal`, `buildType: apk`.
- 빌드가 끝나면 APK 경로가 터미널에 출력됨 (보통 `./build-*.apk` 또는 프로젝트 내 build 폴더).

**빌드 산출물 유지 (디버깅용):**

```powershell
$env:EAS_LOCAL_BUILD_SKIP_CLEANUP = "1"
eas build -p android --profile preview-apk --local
```

---

## 6) 흔한 오류 3개 해결

### 6.1 `JAVA_HOME is not set` / `java` 를 찾을 수 없음

- **원인:** JAVA_HOME 미설정 또는 Path에 java 미포함.
- **해결:**
  1. Android Studio 설치 경로에서 **jbr** 폴더 확인  
     (예: `C:\Program Files\Android\Android Studio\jbr`).
  2. **사용자 변수**에 `JAVA_HOME` = 위 경로 추가.
  3. PowerShell **새로 연 뒤** `java -version` 다시 실행.

### 6.2 `ANDROID_HOME` / SDK 경로를 찾을 수 없음

- **원인:** ANDROID_HOME 미설정 또는 SDK 미설치.
- **해결:**
  1. Android Studio → **Settings (Ctrl+Alt+S)** → **Languages & Frameworks** → **Android SDK**.
  2. **Android SDK location** 경로 복사 (예: `C:\Users\jinseong\AppData\Local\Android\Sdk`).
  3. **사용자 변수**에 `ANDROID_HOME` = 해당 경로 추가.
  4. **SDK Platforms** 에서 필요한 API 레벨(예: 34), **SDK Tools** 에서 **NDK**, **Build-Tools** 설치 후 확인.

### 6.3 `Android SDK license not accepted` / 라이선스 미동의

- **원인:** SDK 라이선스에 동의하지 않음.
- **해결:**
  1. PowerShell에서:
     ```powershell
     & "$env:ANDROID_HOME\tools\bin\sdkmanager.bat" --licenses
     ```
     또는 (경로가 다를 수 있음):
     ```powershell
     & "$env:ANDROID_HOME\cmdline-tools\latest\bin\sdkmanager.bat" --licenses
     ```
  2. 모든 항목에서 `y` 입력 후 엔터.
  3. 그래도 실패하면 Android Studio를 한 번 실행한 뒤 **SDK Manager**에서 라이선스 동의 후, 위 명령 다시 실행.

---

## 요약

| 항목 | 내용 |
|------|------|
| 최소 설정 | JAVA_HOME, Path에 platform-tools |
| 선택 | ANDROID_HOME |
| 확인 | `java -version`, `adb version` |
| 빌드 | `cd mobile` → `eas build -p android --profile preview-apk --local` |
| 로그 | 폰 연결 후 `adb logcat` (필터 걸어서 사용) |

Managed 구조는 그대로 두고, prebuild 없이 **EAS local build**만 사용하는 흐름입니다.
