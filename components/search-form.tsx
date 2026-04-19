"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import { resolveWordForQuery } from "@/data/mock";
import { recordSearch } from "@/lib/search-history";
import { Button, TextField } from "@/components/ui";
import { cn } from "@/lib/utils";

type SearchFormProps = {
  variant?: "hero" | "compact";
  initialValue?: string;
  className?: string;
  autoFocus?: boolean;
};

export function SearchForm({
  variant = "compact",
  initialValue = "",
  className,
  autoFocus,
}: SearchFormProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialValue);

  const isHero = variant === "hero";

  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = query.trim();

    if (!trimmed) {
      return;
    }

    const match = resolveWordForQuery(trimmed);

    if (match) {
      recordSearch({
        query: trimmed,
        href: `/word/${match.slug}`,
        title: match.title,
      });
      router.push(`/word/${match.slug}`);
      return;
    }

    recordSearch({
      query: trimmed,
      href: `/?q=${encodeURIComponent(trimmed)}`,
      title: undefined,
    });
    router.push(`/?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(isHero ? "space-y-3" : "w-full", className)}
    >
      <div className={cn("grid gap-3", isHero ? "md:grid-cols-[1fr_auto]" : "sm:grid-cols-[1fr_auto]")}>
        <TextField
          label={isHero ? "Search" : "Quick search"}
          value={query}
          onChange={setQuery}
          placeholder="Search a word or phrase"
          autoFocus={autoFocus}
          labelClassName={isHero ? "" : "sr-only"}
          className={isHero ? "md:min-w-0" : "min-w-0"}
        />
        <Button type="submit" className={cn("self-end", isHero ? "md:min-w-32" : "sm:min-w-28")}>
          Search
        </Button>
      </div>
      {isHero ? (
        <p className="text-sm leading-7 text-muted">
          e.g. salient / contemplate / issue bonds
        </p>
      ) : null}
    </form>
  );
}
