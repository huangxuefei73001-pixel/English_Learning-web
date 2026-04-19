"use client";

import Link from "next/link";

import { recentSearches } from "@/data/mock";
import {
  formatHistoryTime,
  useSearchHistory,
  clearSearchHistory,
} from "@/lib/search-history";
import { Button, Pill } from "@/components/ui";
import { cn } from "@/lib/utils";

type SearchTrailProps = {
  className?: string;
};

export function SearchTrail({ className }: SearchTrailProps) {
  const history = useSearchHistory();
  const items = history.length ? history : recentSearches.map((item, index) => ({
    query: item.label,
    href: `/word/${item.slug}`,
    title: item.label,
    savedAt: [
      "2026-03-30T09:12:00.000Z",
      "2026-03-30T09:28:00.000Z",
      "2026-03-30T09:44:00.000Z",
    ][index] ?? "2026-03-30T10:00:00.000Z",
    count: 1,
  }));

  return (
    <section
      className={cn(
        "rounded-[32px] border border-line bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(247,250,248,0.92))] p-5 shadow-soft sm:p-6",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">
            Search trail
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-text">
            Your looked-up words stay here.
          </h2>
          <p className="mt-3 text-sm leading-7 text-muted">
            Like a private word history in ChatGPT, but shaped as a clean study trail.
          </p>
        </div>
        <Button tone="secondary" className="min-h-10 px-4 py-2 text-xs" onClick={clearSearchHistory}>
          Clear
        </Button>
      </div>

      <div className="mt-5">
        <div className="relative pl-5">
          <div className="absolute left-[7px] top-0 h-full w-px bg-line" />
          <div className="space-y-4">
            {items.slice(0, 6).map((item, index) => (
              <Link
                key={`${item.query}-${index}`}
                href={item.href}
                className="group relative block rounded-[24px] border border-transparent bg-white/75 p-4 transition hover:-translate-y-0.5 hover:border-primary hover:bg-white"
              >
                <span className="absolute -left-[17px] top-5 h-3.5 w-3.5 rounded-full border border-primary bg-bg shadow-[0_0_0_4px_rgba(47,107,87,0.08)]" />
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold tracking-tight text-text">
                      {item.query}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {item.title ?? "No direct match"} · {formatHistoryTime(item.savedAt)}
                    </p>
                  </div>
                  <Pill tone={item.count > 1 ? "primary" : "line"} className="shrink-0">
                    {item.count}x
                  </Pill>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
