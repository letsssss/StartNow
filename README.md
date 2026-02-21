# StartNow

Expo (React Native) + Next.js API. 할 일/고민을 입력하면 워크플로우로 정리해 주는 앱.

## 구조

- **api/** – Next.js 16, `/api/structure` (POST: 텍스트 → 구조화 결과)
- **mobile/** – Expo 54, 입력/결과 화면, 워크플로우 카드

## 로컬 실행

1. **API** (터미널 1)
   ```bash
   npm run api
   # 또는 cd api && npx next dev -H 0.0.0.0
   ```
2. **모바일** (터미널 2)
   ```bash
   npm run qr
   # 또는 cd mobile && npx expo start -c
   ```
3. **mobile/.env** – `EXPO_PUBLIC_API_BASE_URL=http://PC_IP:3000` (실제 PC IPv4로 설정)

## GitHub 백업 (새 저장소에 푸시)

저장소가 아직 없다면:

1. GitHub에서 **New repository** → 이름 예: `StartNow` → Create.
2. 아래 실행 (본인 계정/저장소 이름으로 URL 수정):

   ```bash
   cd C:\Users\jinseong\Desktop\StartNow
   git remote add origin https://github.com/YOUR_USERNAME/StartNow.git
   git branch -M main
   git push -u origin main
   ```

   또는 GitHub CLI 로그인 후:

   ```bash
   gh auth login
   gh repo create StartNow --private --source=. --remote=origin --push
   ```
