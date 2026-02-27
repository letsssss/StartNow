/**
 * Vercel /api/structure 200 응답 확인 스크립트 (10초 타임아웃)
 * 실행: node scripts/test-structure-api.mjs
 */

const URL = "https://thinkflow-api-lac.vercel.app/api/structure";
const BODY = { text: "테스트입니다" };
const TIMEOUT_MS = 10_000;

async function main() {
  const ac = new AbortController();
  const timeout = setTimeout(() => ac.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(BODY),
      signal: ac.signal,
    });

    clearTimeout(timeout);

    const raw = await res.text();
    const contentLength = raw.length;

    console.log("--- status ---");
    console.log(res.status, res.statusText);
    console.log("\n--- headers (content-type) ---");
    console.log(res.headers.get("content-type") ?? "(없음)");
    console.log("\n--- raw text (앞 300자) ---");
    console.log(raw.slice(0, 300) + (raw.length > 300 ? "..." : ""));

    let parsed = null;
    try {
      parsed = JSON.parse(raw);
      console.log("\n--- JSON 파싱 결과 ---");
      console.log(JSON.stringify(parsed, null, 2).slice(0, 500) + (raw.length > 500 ? "..." : ""));
    } catch {
      console.log("\n--- JSON 파싱 ---");
      console.log("(파싱 불가)");
    }

    const ok = res.ok ? "✅ 200 대역" : "❌ 비정상 status";
    console.log("\n--- 결론 ---");
    console.log(ok, "| status =", res.status);
  } catch (e) {
    clearTimeout(timeout);
    console.error("--- 에러 ---");
    if (e.name === "AbortError") {
      console.error("타임아웃:", TIMEOUT_MS / 1000, "초 초과");
    } else {
      console.error("원인:", e?.message ?? String(e));
    }
    process.exit(1);
  }
}

main();
