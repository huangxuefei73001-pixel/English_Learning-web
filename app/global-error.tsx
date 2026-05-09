"use client";

import { useEffect } from "react";

const RECOVERY_FLAG = "word-atlas.error-recovery-v1";
const STORAGE_KEYS = [
  "word-atlas.favorites",
  "lexicon-garden.search-history",
  "word-atlas.storage-version",
];

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const hasRecovered = window.sessionStorage.getItem(RECOVERY_FLAG);
      if (hasRecovered) {
        return;
      }

      STORAGE_KEYS.forEach((key) => window.localStorage.removeItem(key));
      window.sessionStorage.setItem(RECOVERY_FLAG, "1");
      window.location.reload();
    } catch {
      // Fall through to the manual recovery UI below.
    }
  }, []);

  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-[#f6f1e7] text-[#191813]">
        <main className="mx-auto flex min-h-screen max-w-2xl items-center justify-center px-6">
          <div className="w-full rounded-[28px] border border-[#d8d0be] bg-white/85 p-6 shadow-[0_24px_80px_rgba(63,57,36,0.08)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#7a705f]">
              Word Islands recovery
            </p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-[#191813]">
              页面数据刚刚做了自动清理
            </h1>
            <p className="mt-3 text-sm leading-7 text-[#625b4f]">
              我们检测到浏览器里有旧版本数据可能导致首页白屏。系统已经尝试自动恢复，你可以点击下面的按钮重新加载页面。
            </p>
            <p className="mt-3 text-xs leading-6 text-[#8b5d22]">
              {error.message}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  try {
                    window.sessionStorage.removeItem(RECOVERY_FLAG);
                  } catch {
                    // Ignore session cleanup failure.
                  }
                  reset();
                }}
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#191813] px-5 text-sm font-semibold text-[#f7f2e8]"
              >
                重新加载
              </button>
              <button
                type="button"
                onClick={() => {
                  try {
                    STORAGE_KEYS.forEach((key) => window.localStorage.removeItem(key));
                    window.sessionStorage.removeItem(RECOVERY_FLAG);
                  } catch {
                    // Ignore storage cleanup failure.
                  }
                  window.location.reload();
                }}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#d9d1bf] bg-white/90 px-5 text-sm font-semibold text-[#191813]"
              >
                清理后刷新
              </button>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
