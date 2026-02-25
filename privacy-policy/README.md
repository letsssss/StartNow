# ThinkFlow 개인정보처리방침 (GitHub Pages)

Google Play Console에 등록할 **개인정보처리방침 URL**을 GitHub Pages로 공개하기 위한 폴더입니다.

---

## 1. GitHub Pages 켜는 방법

1. 해당 저장소(**StartNow** 또는 이 폴더가 들어 있는 repo)의 **GitHub** 페이지로 이동합니다.
2. 상단 메뉴에서 **Settings** 클릭.
3. 왼쪽 사이드바에서 **Pages** 클릭.
4. **Build and deployment** 아래 **Source**에서 **Deploy from a branch** 선택.
5. **Branch**에서 `main`(또는 기본 브랜치), **Folder**에서 `/ (root)` 선택.
6. **Save** 클릭.

몇 분 후 페이지가 배포됩니다.

---

## 2. 공개 URL 형태

- 저장소가 `https://github.com/<github-username>/<repo-name>` 이라면:
- **개인정보처리방침 페이지 URL**은 다음 형태가 됩니다:

  ```
  https://<github-username>.github.io/<repo-name>/privacy-policy/
  ```

  또는 (index.html이 있으므로):

  ```
  https://<github-username>.github.io/<repo-name>/privacy-policy/index.html
  ```

- **예:** username이 `letsssss`, repo 이름이 `StartNow`이면  
  `https://letsssss.github.io/StartNow/privacy-policy/`

---

## 3. Google Play Console에 넣는 방법

1. **Google Play Console** → 해당 앱 선택.
2. **정책** → **앱 콘텐츠** → **개인정보처리방침** 항목으로 이동.
3. **개인정보처리방침 URL** 입력란에 위에서 확인한 URL을 넣습니다.  
   예: `https://letsssss.github.io/StartNow/privacy-policy/`
4. 저장 후 제출합니다.

---

## 4. 수정 시

- `index.html` 내용을 수정한 뒤, 해당 브랜치에 커밋·푸시하면 GitHub Pages가 자동으로 다시 배포합니다.
- **placeholder** 로 표시된 이메일 주소는 반드시 실제 운영용 주소로 바꿔서 사용하세요.
