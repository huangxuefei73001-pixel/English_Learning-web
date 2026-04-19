import Link from "next/link";

import { SearchForm } from "@/components/search-form";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-bg/88 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <SearchForm variant="compact" />
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="group inline-flex flex-col">
            <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-primary">
              Lexicon Garden
            </span>
            <span className="mt-1 text-sm text-muted transition group-hover:text-text">
              personal English vocabulary studio
            </span>
          </Link>
          <span className="hidden rounded-full border border-line bg-white/80 px-3 py-1 text-xs font-semibold text-muted md:inline-flex">
            search first
          </span>
        </div>
      </div>
    </header>
  );
}
