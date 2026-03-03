import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ThinkFlow Support | 공식 지원",
  description:
    "ThinkFlow 앱 문의, 구독·환불 안내, 자주 묻는 질문. 이메일 지원 및 App Store 구독 관리 안내.",
  openGraph: {
    title: "ThinkFlow Support",
    description: "ThinkFlow 공식 지원 페이지. 문의 방법, 구독·환불 안내, FAQ.",
  },
};

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100">
      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
        <h1 className="mb-8 text-2xl font-semibold tracking-tight sm:text-3xl">
          ThinkFlow Support
        </h1>

        <section className="mb-10">
          <h2 className="mb-3 text-lg font-medium text-neutral-800 dark:text-neutral-200">
            1. 문의 방법
          </h2>
          <ul className="list-inside list-disc space-y-1 text-neutral-600 dark:text-neutral-400">
            <li>
              이메일:{" "}
              <a
                href="mailto:thinkflow.help@gmail.com"
                className="text-blue-600 underline hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                thinkflow.help@gmail.com
              </a>
            </li>
            <li>응답 시간: 영업일 기준 48시간 이내</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="mb-3 text-lg font-medium text-neutral-800 dark:text-neutral-200">
            2. 구독 관련 안내
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400">
            구독은 App Store를 통해 관리됩니다. 구독 관리 및 해지는{" "}
            <strong className="text-neutral-800 dark:text-neutral-200">
              기기 설정 &gt; Apple ID &gt; 구독
            </strong>
            에서 가능합니다.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-3 text-lg font-medium text-neutral-800 dark:text-neutral-200">
            3. 환불 관련
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400">
            환불은 Apple 정책에 따라 App Store를 통해 진행됩니다.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="mb-4 text-lg font-medium text-neutral-800 dark:text-neutral-200">
            4. 자주 묻는 질문
          </h2>
          <dl className="space-y-5">
            <div>
              <dt className="mb-1 font-medium text-neutral-800 dark:text-neutral-200">
                데이터는 어디에 저장되나요?
              </dt>
              <dd className="text-neutral-600 dark:text-neutral-400">
                데이터는 사용자 기기에 저장됩니다. 구독 시 동기화 기능을 통해 더 넓게 활용할 수 있습니다.
              </dd>
            </div>
            <div>
              <dt className="mb-1 font-medium text-neutral-800 dark:text-neutral-200">
                로그인 없이 사용 가능한가요?
              </dt>
              <dd className="text-neutral-600 dark:text-neutral-400">
                기본 기능은 로그인 없이 사용할 수 있습니다. 구독 및 복원은 Apple ID로 인증합니다.
              </dd>
            </div>
            <div>
              <dt className="mb-1 font-medium text-neutral-800 dark:text-neutral-200">
                기기 변경 시 데이터는 유지되나요?
              </dt>
              <dd className="text-neutral-600 dark:text-neutral-400">
                구독은 Apple ID에 연결되어 있어 동일 계정으로 복원할 수 있습니다. 로컬 데이터는 기기별로 관리됩니다.
              </dd>
            </div>
          </dl>
        </section>

        <footer className="border-t border-neutral-200 pt-6 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
          © 2026 ThinkFlow
        </footer>
      </main>
    </div>
  );
}
