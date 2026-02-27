const base = require("./app.json");

// 빌드 시점에만 process.env 사용. 로컬은 .env, EAS는 프로필별 env/Secret.
// production/preview 빌드 → https 도메인 필수(어떤 네트워크에서도 동작).
// development(로컬 npx expo start) → .env에 로컬 IP 가능.
module.exports = {
  expo: {
    ...base.expo,
    extra: {
      ...base.expo?.extra,
      apiBaseUrl:
        process.env.EXPO_PUBLIC_API_BASE_URL ??
        process.env.API_BASE_URL ??
        "",
    },
  },
};
