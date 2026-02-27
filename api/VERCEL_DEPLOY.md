# StartNow/api 별도 Vercel 배포 (TestFlight 앱용 API)

TestFlight(EAS production) 앱의 "서버 연결 실패"를 해결하려면 **StartNow/api**만 별도 Vercel 프로젝트로 Production 배포해야 합니다.

---

## 전제

- **기존** StartNow 루트 배포와 충돌하지 않도록 **새 프로젝트**로 만듭니다.
- 배포 루트는 반드시 **StartNow/api** 폴더입니다. (vercel.json 없이 진행)

---

## Step 1. Vercel 로그인 (최초 1회)

PowerShell에서:

```powershell
cd C:\Users\jinseong\Desktop\StartNow\api
npx vercel login
```

이메일 또는 GitHub 등으로 로그인합니다.

---

## Step 2. api 폴더를 별도 프로젝트로 연결

**반드시 api 폴더**에서 실행:

```powershell
cd C:\Users\jinseong\Desktop\StartNow\api
npx vercel link --yes --project startnow-api
```

- "In which directory is your code located?" → **`./`** (현재 폴더 = api)
- 기존 StartNow 프로젝트에 연결하라고 나오면 **No** 하고, 새 프로젝트 이름을 **startnow-api** 등으로 지정

이미 다른 프로젝트에 연결돼 있으면:

```powershell
Remove-Item -Recurse -Force .vercel -ErrorAction SilentlyContinue
npx vercel link --yes --project startnow-api
```

---

## Step 3. Production 배포

```powershell
cd C:\Users\jinseong\Desktop\StartNow\api
npx vercel --prod
```

배포가 끝나면 터미널에 **Production URL**이 출력됩니다.  
예: `https://startnow-api-xxxxx.vercel.app`

---

## Step 4. 배포 URL에서 /api 동작 확인

1. **헬스 체크**
   - 브라우저에서 `https://배포주소/api/health` 접속
   - `{"status":"ok"}` 가 보이면 정상

2. **실제 API (선택)**
   - 앱에서 쓰는 건 `POST /api/structure`
   - 테스트 시: Postman 등으로 `POST https://배포주소/api/structure` + Body `{"text":"테스트"}` 로 확인

---

## Step 5. EAS Production 빌드에 API 주소 넣기

배포된 **https 도메인**(끝에 `/` 없이)을 EAS 환경 변수에 설정합니다.

### 방법 A: EAS 대시보드

1. [expo.dev](https://expo.dev) → 로그인 → **Projects** → **ThinkFlow**
2. **Environment variables** (또는 **Secrets**) → **Production**
3. 추가:
   - Name: `EXPO_PUBLIC_API_BASE_URL`
   - Value: `https://startnow-api-xxxxx.vercel.app` (본인 배포 URL로 교체)

### 방법 B: 터미널

```powershell
cd C:\Users\jinseong\Desktop\StartNow\mobile
npx eas env:create EXPO_PUBLIC_API_BASE_URL --value "https://배포된도메인.vercel.app" --environment production --visibility plaintext
```

이후 **새로 EAS production 빌드**를 하면 해당 URL이 앱에 박혀 들어갑니다.  
기존에 올린 빌드는 예전 주소를 쓰고 있으므로, **다시 빌드 → TestFlight에 새 빌드 업로드**해야 합니다.

---

## 요약

| 단계 | 명령/작업 |
|------|------------|
| 1 | `cd api` → `npx vercel login` |
| 2 | `npx vercel link --yes --project startnow-api` (api 폴더에서) |
| 3 | `npx vercel --prod` → Production URL 확보 |
| 4 | `https://배포주소/api/health` 로 응답 확인 |
| 5 | EAS Production에 `EXPO_PUBLIC_API_BASE_URL=https://배포주소` 설정 후 새 빌드 |

---

## 참고: Vercel 환경 변수 (API 서버용)

API가 OpenAI를 쓰므로, Vercel 프로젝트 **Settings → Environment Variables** 에 다음을 추가합니다:

- `OPENAI_API_KEY` = (본인 키)
- (선택) `OPENAI_MODEL` = `gpt-4o-mini`

이렇게 해두면 Vercel에서 실행되는 Next.js API가 정상 동작합니다.
