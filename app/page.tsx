import { Suspense } from "react";

import { HomePage } from "@/components/home-page";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[1.12fr_0.88fr]">
          <div className="h-[34rem] rounded-[36px] border border-[#d8d0be] bg-white/75 p-5 shadow-[0_24px_80px_rgba(63,57,36,0.08)]" />
          <div className="space-y-4">
            <div className="h-40 rounded-[32px] border border-[#d8d0be] bg-white/75 p-5 shadow-[0_18px_60px_rgba(63,57,36,0.06)]" />
            <div className="h-44 rounded-[32px] border border-[#d8d0be] bg-[#1a1815]/90 p-5 shadow-[0_22px_70px_rgba(24,21,15,0.18)]" />
          </div>
        </div>
      }
    >
      <HomePage />
    </Suspense>
  );
}
