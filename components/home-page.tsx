"use client";

import Link from "next/link";
import { Fragment, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { recordSearch } from "@/lib/search-history";
import { cn } from "@/lib/utils";
import {
  getWordBySlug,
  type UsageLabel,
  type VocabularyWord,
} from "@/data/mock";

type StudyTab = "meaning" | "difference" | "collocations" | "examples" | "memory";

type FavoriteEntry = {
  word: VocabularyWord;
  savedAt: string;
  note: string;
  tag: UsageLabel;
  streak: number;
  reviewedAt: string;
  dueAt: string;
};

const STORAGE_KEYS = {
  favorites: "word-atlas.favorites",
};

const STUDY_TABS: Array<{ id: StudyTab; label: string; hint: string }> = [
  { id: "meaning", label: "释义", hint: "中文 + 英文释义" },
  { id: "difference", label: "近义词区别", hint: "重点比较" },
  { id: "collocations", label: "常见搭配", hint: "collocations" },
  { id: "examples", label: "例句", hint: "真实上下文" },
  { id: "memory", label: "记忆方法", hint: "好记才会用" },
];

const REVIEW_INTERVALS = [1, 3, 7, 14, 30];
const QUICK_START_WORDS = ["salient", "efficient", "contemplate"] as const;
const PREVIEW_CUES = ["用法", "近义词", "搭配", "记忆方法"] as const;

const SEED_FAVORITES: FavoriteEntry[] = [
  {
  word: getWordBySlug("salient")!,
  savedAt: "2026-03-29T08:20:00.000Z",
  note: "Use when one point rises above the rest and matters most.",
  tag: "formal",
  streak: 2,
  reviewedAt: "2026-03-29T08:20:00.000Z",
  dueAt: "2026-03-30T08:20:00.000Z",
  },
  {
    word: getWordBySlug("contemplate")!,
    savedAt: "2026-03-28T08:20:00.000Z",
    note: "A slower, more reflective kind of thinking.",
    tag: "academic",
    streak: 1,
    reviewedAt: "2026-03-28T08:20:00.000Z",
    dueAt: "2026-03-30T08:20:00.000Z",
  },
  {
    word: getWordBySlug("effective")!,
    savedAt: "2026-03-27T08:20:00.000Z",
    note: "Focus on the result, not the amount of effort.",
    tag: "neutral",
    streak: 3,
    reviewedAt: "2026-03-27T08:20:00.000Z",
    dueAt: "2026-03-30T08:20:00.000Z",
  },
  {
    word: getWordBySlug("issue-bonds")!,
    savedAt: "2026-03-26T08:20:00.000Z",
    note: "A finance phrase for raising money through debt issuance.",
    tag: "formal",
    streak: 1,
    reviewedAt: "2026-03-26T08:20:00.000Z",
    dueAt: "2026-03-31T08:20:00.000Z",
  },
];

const INITIAL_FAVORITES = SEED_FAVORITES.map((item) => ({ ...item }));

const FALLBACK_WORD = getWordBySlug("salient") ?? getWordBySlug("contemplate") ?? getWordBySlug("effective")!;

function safeRead<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }

    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function usePersistentState<T>(key: string, fallback: T) {
  const [state, setState] = useState<T>(fallback);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(safeRead(key, fallback));
    setHydrated(true);
  }, [fallback, key]);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(key, JSON.stringify(state));
  }, [hydrated, key, state]);

  return [state, setState] as const;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatReviewLabel(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "今日复习";
  }

  const now = new Date();
  const due = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = Math.round((due - today) / 86400000);

  if (diff <= 0) {
    return diff < 0 ? `逾期 ${Math.abs(diff)} 天` : "今日复习";
  }

  if (diff === 1) {
    return "明日复习";
  }

  return `${diff} 天后`;
}

function getWordFallback(): VocabularyWord {
  return FALLBACK_WORD;
}

function normalizeWord(word: VocabularyWord | Partial<VocabularyWord> | undefined): VocabularyWord {
  const fallback = getWordFallback();

  return {
    slug: word?.slug || fallback.slug,
    title: word?.title || fallback.title,
    phonetics: {
      uk: word?.phonetics?.uk ?? fallback.phonetics.uk,
      us: word?.phonetics?.us ?? fallback.phonetics.us,
    },
    partOfSpeech: word?.partOfSpeech || fallback.partOfSpeech,
    chineseMeaning: word?.chineseMeaning || fallback.chineseMeaning,
    englishDefinition: word?.englishDefinition || fallback.englishDefinition,
    summary: word?.summary || fallback.summary,
    usageLabels:
      Array.isArray(word?.usageLabels) && word.usageLabels.length > 0
        ? word.usageLabels
        : fallback.usageLabels,
    collocations:
      Array.isArray(word?.collocations) && word.collocations.length > 0
        ? word.collocations.filter(Boolean)
        : fallback.collocations,
    examples:
      Array.isArray(word?.examples) && word.examples.length > 0
        ? word.examples.filter(
            (item): item is { label: UsageLabel; sentence: string } =>
              Boolean(item?.label) && Boolean(item?.sentence),
          )
        : fallback.examples,
    similarWords:
      Array.isArray(word?.similarWords) && word.similarWords.length > 0
        ? word.similarWords.filter(
            (item): item is { slug: string; word: string; note: string } =>
              Boolean(item?.slug) && Boolean(item?.word) && Boolean(item?.note),
          )
        : fallback.similarWords,
    memoryAids: {
      etymology: word?.memoryAids?.etymology ?? fallback.memoryAids.etymology,
      roots: word?.memoryAids?.roots ?? fallback.memoryAids.roots,
      mnemonic: word?.memoryAids?.mnemonic ?? fallback.memoryAids.mnemonic,
    },
    searchAliases:
      Array.isArray(word?.searchAliases) && word.searchAliases.length > 0
        ? word.searchAliases.filter(Boolean)
        : fallback.searchAliases,
  };
}

async function fetchWordFromApi(query: string) {
  const response = await fetch("/api/translate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });

  const payload = (await response.json()) as
    | { word: VocabularyWord; model: string; source?: string; error?: string }
    | { error?: string; details?: string };

  if (!response.ok) {
    throw new Error(
      "error" in payload && payload.error ? payload.error : "Failed to generate the word card.",
    );
  }

  if (!("word" in payload) || !payload.word) {
    throw new Error("The response did not contain a structured word card.");
  }

  return payload;
}

export function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const routeQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(routeQuery);
  const [activeTab, setActiveTab] = useState<StudyTab>("meaning");
  const [selectedWord, setSelectedWord] = useState<VocabularyWord>(getWordFallback());
  const [modelName, setModelName] = useState("openai/gpt-4o-mini");
  const [sourceLabel, setSourceLabel] = useState("OpenRouter");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("Type a word to generate a fresh card.");
  const [error, setError] = useState<string | null>(null);
  const lastFetchedQueryRef = useRef("");
  const [favorites, setFavorites] = usePersistentState<FavoriteEntry[]>(
    STORAGE_KEYS.favorites,
    INITIAL_FAVORITES,
  );

  useEffect(() => {
    setQuery(routeQuery);
  }, [routeQuery]);

  async function loadWord(nextQuery: string, options?: { updateUrl?: boolean; recordHistory?: boolean }) {
    const trimmed = nextQuery.trim();

    if (!trimmed) {
      return;
    }

    const updateUrl = options?.updateUrl ?? true;
    const recordHistory = options?.recordHistory ?? true;

    setQuery(trimmed);
    setLoading(true);
    setError(null);
    setStatus("Generating a structured card...");

    if (updateUrl) {
      router.replace(`/?q=${encodeURIComponent(trimmed)}`, { scroll: false });
    }

    try {
      const payload = await fetchWordFromApi(trimmed);
      setSelectedWord(normalizeWord(payload.word));
      setModelName(payload.model);
      setSourceLabel(payload.source ?? "OpenRouter");
      setStatus(
        payload.source === "mock"
          ? payload.error
            ? `OpenRouter call failed: ${payload.error}`
            : "OpenRouter is not configured yet, so this is a local demo card."
          : `Generated by ${payload.model}.`,
      );

      if (recordHistory) {
        recordSearch({
          query: trimmed,
          href: `/?q=${encodeURIComponent(trimmed)}`,
          title: payload.word.title,
        });
      }

      lastFetchedQueryRef.current = trimmed;
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Something went wrong while generating the card.";
      setError(message);
      setModelName("error");
      setSourceLabel("error");
      setStatus(`OpenRouter error: ${message}`);

      if (recordHistory) {
        recordSearch({
          query: trimmed,
          href: `/?q=${encodeURIComponent(trimmed)}`,
          title: trimmed,
        });
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const trimmed = routeQuery.trim();
    if (!trimmed || trimmed === lastFetchedQueryRef.current) {
      return;
    }

    void loadWord(trimmed, { updateUrl: false, recordHistory: false });
  }, [routeQuery]);

  const favoriteMap = useMemo(
    () => new Map(favorites.map((item) => [item.word.slug, item])),
    [favorites],
  );

  const favoriteCount = favorites.length;
  const dueCount = favorites.filter((item) => {
    const due = new Date(item.dueAt);
    return !Number.isNaN(due.getTime()) && due.getTime() <= Date.now();
  }).length;

  const favoriteEntry = favoriteMap.get(selectedWord.slug);
  const isFavorited = Boolean(favoriteEntry);

  const reviewQueue = useMemo(
    () =>
      [...favorites].sort((left, right) => {
        const leftDue = new Date(left.dueAt).getTime();
        const rightDue = new Date(right.dueAt).getTime();
        return leftDue - rightDue;
      }),
    [favorites],
  );

  function syncSelection(nextQuery: string) {
    setActiveTab("meaning");
    void loadWord(nextQuery, { updateUrl: true, recordHistory: true });
  }

  const previewExample = selectedWord.examples.at(0)?.sentence ?? selectedWord.summary;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }

    syncSelection(trimmed);
  }

  function toggleFavorite(word: VocabularyWord) {
    setFavorites((current) => {
      const existing = current.find((item) => item.word.slug === word.slug);

      if (existing) {
        return current.filter((item) => item.word.slug !== word.slug);
      }

      const now = new Date();

      return [
        {
          word,
          savedAt: now.toISOString(),
          note: word.memoryAids.mnemonic,
          tag: word.usageLabels[0] ?? "neutral",
          streak: 1,
          reviewedAt: now.toISOString(),
          dueAt: addDays(now, REVIEW_INTERVALS[0]).toISOString(),
        },
        ...current,
      ];
    });
  }

  function markReviewed(word: VocabularyWord) {
    setFavorites((current) => {
      const now = new Date();
      let updated = false;

      const next = current.map((item) => {
        if (item.word.slug !== word.slug) {
          return item;
        }

        updated = true;
        const streak = Math.min(item.streak + 1, REVIEW_INTERVALS.length);
        const interval = REVIEW_INTERVALS[Math.min(streak - 1, REVIEW_INTERVALS.length - 1)];

        return {
          ...item,
          streak,
          reviewedAt: now.toISOString(),
          dueAt: addDays(now, interval).toISOString(),
          note: item.note || word.memoryAids.mnemonic,
          tag: item.tag,
        };
      });

      if (!updated) {
        next.unshift({
          word,
          savedAt: now.toISOString(),
          note: word.memoryAids.mnemonic,
          tag: word.usageLabels[0] ?? "neutral",
          streak: 1,
          reviewedAt: now.toISOString(),
          dueAt: addDays(now, REVIEW_INTERVALS[0]).toISOString(),
        });
      }

      return next;
    });
  }

  function removeFromQueue(word: VocabularyWord) {
    setFavorites((current) => current.filter((item) => item.word.slug !== word.slug));
  }

  return (
    <main className="relative isolate min-h-screen overflow-hidden px-4 pb-8 pt-4 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(86,101,58,0.18),transparent_24%),radial-gradient(circle_at_85%_15%,rgba(181,151,82,0.14),transparent_20%),linear-gradient(180deg,rgba(255,255,255,0.42),rgba(255,255,255,0))]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 bg-[linear-gradient(90deg,rgba(255,249,237,0.62),rgba(255,255,255,0)_28%,rgba(224,214,188,0.4)_72%,rgba(255,255,255,0.02))] blur-3xl" />

      <section className="mx-auto w-full max-w-6xl">
        <div className="relative overflow-hidden rounded-[40px] border border-[#d8d0be] bg-[linear-gradient(160deg,rgba(255,250,241,0.96),rgba(246,239,224,0.82))] px-5 py-6 shadow-[0_28px_90px_rgba(63,57,36,0.08)] backdrop-blur-sm sm:px-7 sm:py-8 lg:px-8 lg:py-9">
          <div className="absolute -left-10 top-6 h-28 w-28 rounded-full bg-[radial-gradient(circle,rgba(191,177,133,0.22),transparent_68%)] blur-2xl" />
          <div className="absolute right-0 top-0 h-40 w-56 bg-[radial-gradient(circle_at_top_right,rgba(86,101,58,0.14),transparent_72%)]" />
          <div className="absolute bottom-0 right-12 h-24 w-24 rounded-full border border-white/30 bg-white/20 blur-[2px]" />

          <div className="relative space-y-6">
            <div className="max-w-3xl space-y-3">
              <span className="inline-flex items-center rounded-full border border-[#d7cfbd] bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#6a7258] shadow-[0_8px_24px_rgba(63,57,36,0.05)]">
                English learning island
              </span>
              <h1 className="text-[2.9rem] font-semibold tracking-[-0.04em] text-[#191813] sm:text-[4.2rem] lg:text-[5.3rem]">
                Word Islands
              </h1>
              <p className="text-base font-medium tracking-[0.02em] text-[#5f5a4f] sm:text-xl">
                你的英语学习小岛
              </p>
              <p className="max-w-2xl text-sm font-medium leading-7 text-[#4f5d3b] sm:text-[15px]">
                每个单词都会展开成一张学习卡：用法｜近义词｜搭配｜记忆方法
              </p>
              <p className="max-w-xl text-sm leading-7 text-[#756d60] sm:text-[15px]">
                查一个词，不只是翻译，而是学会怎么用。
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-4 rounded-[32px] border border-[#d8cfbe] bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(250,245,235,0.72))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.78),0_18px_50px_rgba(63,57,36,0.05)] sm:p-4"
            >
              <label className="block rounded-[28px] border border-[#cfc5ae] bg-white/92 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.82)]">
                <span className="sr-only">Search word</span>
                <div className="flex min-h-16 items-stretch gap-3">
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="输入一个单词，比如 salient"
                    className="min-w-0 flex-1 rounded-[22px] border-0 bg-transparent px-4 text-base font-medium text-[#191813] outline-none placeholder:text-[#8b8477]"
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <button
                    type="submit"
                    className="inline-flex min-w-28 items-center justify-center rounded-[22px] bg-[#191813] px-5 text-sm font-semibold text-[#f7f2e8] shadow-[0_14px_30px_rgba(25,24,19,0.18)] transition hover:bg-[#303024]"
                  >
                    搜索
                  </button>
                </div>
              </label>

              <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-[#8a8377]">
                <span className="rounded-full border border-[#d9d1bf] bg-white/70 px-3 py-1 font-semibold">
                  {selectedWord.partOfSpeech}
                </span>
                <span className="rounded-full border border-[#d9d1bf] bg-white/70 px-3 py-1 font-semibold">
                  UK {selectedWord.phonetics.uk}
                </span>
              </div>

              <p
                className={cn(
                  "text-sm leading-7",
                  error ? "text-[#8b5d22]" : "text-[#5f5a4f]",
                )}
                aria-live="polite"
              >
                {status}
              </p>
              {error ? (
                <p className="mt-2 text-xs leading-6 text-[#8b5d22]">{error}</p>
              ) : null}

              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-[#e2d9c8] pt-3 text-sm text-[#625b4f]">
                <span className="font-medium text-[#6d6659]">试试这些词：</span>
                {QUICK_START_WORDS.map((item, index) => (
                  <Fragment key={item}>
                    <button
                      type="button"
                      onClick={() => syncSelection(item)}
                      className="font-medium text-[#191813] underline decoration-[#c9b792] underline-offset-4 transition hover:text-[#5c6a46] hover:decoration-[#5c6a46]"
                    >
                      {item}
                    </button>
                    {index < QUICK_START_WORDS.length - 1 ? (
                      <span aria-hidden="true" className="text-[#9f937d]">
                        ·
                      </span>
                    ) : null}
                  </Fragment>
                ))}
              </div>
            </form>

            <div className="rounded-[32px] border border-[#d9d1bf] bg-[linear-gradient(180deg,rgba(255,255,255,0.78),rgba(249,244,234,0.86))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.82)] sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-2xl">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#7a705f]">
                    Study Card Preview
                  </p>
                  <div className="mt-3 flex flex-wrap items-end gap-x-3 gap-y-2">
                    <h2 className="text-3xl font-semibold tracking-tight text-[#191813] sm:text-[2.5rem]">
                      {selectedWord.title}
                    </h2>
                    <span className="rounded-full border border-[#d9d1bf] bg-white/80 px-3 py-1 text-[11px] font-semibold text-[#625b4f]">
                      {selectedWord.partOfSpeech}
                    </span>
                  </div>
                  <p className="mt-3 max-w-xl text-sm leading-7 text-[#625b4f] sm:text-[15px]">
                    {selectedWord.summary}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => syncSelection(selectedWord.title)}
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#d9d1bf] bg-white/78 px-4 text-sm font-semibold text-[#191813] transition hover:border-[#9c8c63] hover:bg-white"
                >
                  打开这张学习卡
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {PREVIEW_CUES.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-[#d9d1bf] bg-[#f9f4ea] px-3 py-1 text-xs font-semibold text-[#625b4f]"
                  >
                    {item}
                  </span>
                ))}
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="rounded-[24px] border border-[#d9d1bf] bg-white/80 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#7a705f]">
                    Meaning snapshot
                  </p>
                  <p className="mt-3 text-sm font-medium text-[#191813]">
                    {selectedWord.englishDefinition}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[#625b4f]">
                    {selectedWord.chineseMeaning}
                  </p>
                </div>

                <div className="rounded-[24px] border border-[#d9d1bf] bg-[#f9f4ea] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#7a705f]">
                    Learning glimpse
                  </p>
                  <p className="mt-3 text-sm leading-7 text-[#625b4f]">
                    {previewExample}
                  </p>
                  <p className="mt-3 text-sm text-[#6d6659]">
                    你会继续看到近义词区分、常见搭配和记忆方法，而不只是一个翻译结果。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-6 w-full max-w-6xl space-y-6">
        <section className="rounded-[36px] border border-[#d8d0be] bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(247,240,225,0.82))] p-5 shadow-[0_20px_70px_rgba(63,57,36,0.07)] sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-3xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[#7a705f]">
                  Study card
                </p>
                <h2 className="mt-2 text-4xl font-semibold tracking-tight text-[#191813] sm:text-5xl">
                  {selectedWord.title}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-[#625b4f] sm:text-base">
                  {selectedWord.summary}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => toggleFavorite(selectedWord)}
                  className={cn(
                    "inline-flex min-h-11 items-center justify-center rounded-full border px-4 text-sm font-semibold transition",
                    isFavorited
                      ? "border-[#191813] bg-[#191813] text-[#f7f2e8]"
                      : "border-[#d9d1bf] bg-white/75 text-[#191813] hover:border-[#9c8c63] hover:bg-white",
                  )}
                >
                  {isFavorited ? "取消收藏" : "收藏单词"}
                </button>
                <Link
                  href={`/word/${selectedWord.slug}`}
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#d9d1bf] bg-white/75 px-4 text-sm font-semibold text-[#191813] transition hover:border-[#9c8c63] hover:bg-white"
                >
                  打开独立词条
                </Link>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full border border-[#d9d1bf] bg-white/75 px-3 py-1 text-xs font-semibold text-[#5f5a4f]">
                UK {selectedWord.phonetics.uk}
              </span>
              <span className="rounded-full border border-[#d9d1bf] bg-white/75 px-3 py-1 text-xs font-semibold text-[#5f5a4f]">
                US {selectedWord.phonetics.us}
              </span>
              <span className="rounded-full border border-[#d9d1bf] bg-white/75 px-3 py-1 text-xs font-semibold text-[#5f5a4f]">
                {selectedWord.partOfSpeech}
              </span>
              {selectedWord.usageLabels.map((label) => (
                <span
                  key={label}
                  className="rounded-full border border-[#d9d1bf] bg-white/75 px-3 py-1 text-xs font-semibold capitalize text-[#5f5a4f]"
                >
                  {label}
                </span>
              ))}
            </div>

            <div className="mt-6 rounded-[30px] border border-[#d9d1bf] bg-white/72 p-2">
              <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                {STUDY_TABS.map((tab) => {
                  const active = tab.id === activeTab;

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "flex min-w-[10rem] flex-col items-start rounded-[22px] border px-4 py-3 text-left transition",
                        active
                          ? "border-[#191813] bg-[#191813] text-[#f7f2e8]"
                          : "border-transparent bg-transparent text-[#625b4f] hover:border-[#d9d1bf] hover:bg-white",
                      )}
                    >
                      <span className="text-sm font-semibold">{tab.label}</span>
                      <span
                        className={cn(
                          "mt-1 text-[11px] uppercase tracking-[0.22em]",
                          active ? "text-[#cfbf9d]" : "text-[#8a8377]",
                        )}
                      >
                        {tab.hint}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 animate-float-in">
              {activeTab === "meaning" ? (
                <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
                  <div className="space-y-4">
                    <Panel label="中文释义" value={selectedWord.chineseMeaning} tone="warm" />
                    <Panel label="英文释义" value={selectedWord.englishDefinition} />
                    <Panel
                      label="学习提醒"
                      value="先记住这个词的核心边界，再去看别的词为什么不能替代它。"
                    />
                  </div>

                  <div className="space-y-4 rounded-[30px] border border-[#d9d1bf] bg-white/65 p-4 sm:p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#7a705f]">
                      Meaning snapshot
                    </p>
                    <div className="mt-4 space-y-3">
                      <div className="rounded-[24px] border border-[#d9d1bf] bg-[#f9f4ea] p-4">
                        <p className="text-sm font-semibold text-[#191813]">This word means</p>
                        <p className="mt-2 text-sm leading-7 text-[#625b4f]">
                          {selectedWord.summary}
                        </p>
                      </div>
                      <div className="rounded-[24px] border border-[#d9d1bf] bg-white/80 p-4">
                        <p className="text-sm font-semibold text-[#191813]">Quick anchor</p>
                        <p className="mt-2 text-sm leading-7 text-[#625b4f]">
                          {selectedWord.memoryAids.mnemonic}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {activeTab === "difference" ? (
                <div className="grid gap-4">
                  <div className="rounded-[30px] border border-[#d9d1bf] bg-white/70 p-4 sm:p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#7a705f]">
                      同义词对比重点
                    </p>
                    <p className="mt-3 text-sm leading-7 text-[#625b4f]">
                      看近义词时，别只看“意思像不像”，要看它们强调的是结果、过程、语气还是场景。
                    </p>
                  </div>

                  {selectedWord.similarWords.map((item, index) => (
                    <article
                      key={item.slug}
                      className="rounded-[30px] border border-[#d9d1bf] bg-white/70 p-4 sm:p-5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-2xl font-semibold tracking-tight text-[#191813]">
                            {item.word}
                          </p>
                          <p className="mt-1 text-[11px] uppercase tracking-[0.24em] text-[#7a705f]">
                            和 {selectedWord.title} 的区别 {index + 1}
                          </p>
                        </div>
                        <span className="rounded-full border border-[#d9d1bf] bg-[#f9f4ea] px-3 py-1 text-xs font-semibold text-[#625b4f]">
                          careful contrast
                        </span>
                      </div>
                      <p className="mt-4 text-sm leading-7 text-[#625b4f]">{item.note}</p>
                    </article>
                  ))}
                </div>
              ) : null}

              {activeTab === "collocations" ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  {selectedWord.collocations.map((item, index) => (
                    <article
                      key={item}
                      className="rounded-[30px] border border-[#d9d1bf] bg-white/70 p-4 sm:p-5"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-lg font-semibold tracking-tight text-[#191813]">{item}</p>
                        <span className="rounded-full border border-[#d9d1bf] bg-[#f9f4ea] px-3 py-1 text-xs font-semibold text-[#625b4f]">
                          0{index + 1}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-7 text-[#625b4f]">
                        把它当成一个固定块来记，比单独背单词更容易在口语和写作里自然出现。
                      </p>
                    </article>
                  ))}
                </div>
              ) : null}

              {activeTab === "examples" ? (
                <div className="space-y-4">
                  {selectedWord.examples.map((example) => (
                    <article
                      key={`${selectedWord.slug}-${example.sentence}`}
                      className="rounded-[30px] border border-[#d9d1bf] bg-white/70 p-4 sm:p-5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="rounded-full border border-[#d9d1bf] bg-[#f9f4ea] px-3 py-1 text-xs font-semibold capitalize text-[#625b4f]">
                          {example.label}
                        </span>
                        <span className="text-[11px] uppercase tracking-[0.24em] text-[#7a705f]">
                          example sentence
                        </span>
                      </div>
                      <p className="mt-4 text-sm leading-8 text-[#191813] sm:text-[15px]">
                        {example.sentence}
                      </p>
                    </article>
                  ))}
                </div>
              ) : null}

              {activeTab === "memory" ? (
                <div className="grid gap-4 lg:grid-cols-3">
                  <Panel label="词源提示" value={selectedWord.memoryAids.etymology} tone="warm" />
                  <Panel label="核心拆解" value={selectedWord.memoryAids.roots} />
                  <Panel label="记忆口诀" value={selectedWord.memoryAids.mnemonic} />
                </div>
              ) : null}
            </div>
        </section>

        <section className="rounded-[32px] border border-[#d8d0be] bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(246,239,225,0.84))] p-5 shadow-[0_20px_70px_rgba(63,57,36,0.06)] sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#7a705f]">
                收藏词库
              </p>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[#191813]">
                进入复习队列
              </h3>
              <p className="mt-3 text-sm leading-7 text-[#625b4f]">
                收藏词条会集中进入这里，按复习到期时间排序，方便你继续完成下一轮学习。
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-[#d9d1bf] bg-white/80 px-3 py-2 text-xs font-semibold text-[#625b4f]">
                {favoriteCount} words
              </span>
              <span className="rounded-full border border-[#d9d1bf] bg-white/80 px-3 py-2 text-xs font-semibold text-[#625b4f]">
                {dueCount} 项待复习
              </span>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {reviewQueue.map((item) => {
              const word = item.word;
              const dueLabel = formatReviewLabel(item.dueAt);
              const dueSoon = new Date(item.dueAt).getTime() <= Date.now();

              return (
                <div
                  key={word.slug}
                  className="rounded-[24px] border border-[#d9d1bf] bg-white/72 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <button
                      type="button"
                      onClick={() => syncSelection(word.title)}
                      className="text-left"
                    >
                      <p className="text-lg font-semibold tracking-tight text-[#191813]">
                        {word.title}
                      </p>
                      <p className="mt-1 text-sm text-[#625b4f]">{item.note}</p>
                    </button>
                    <span
                      className={cn(
                        "shrink-0 rounded-full border px-3 py-1 text-[11px] font-semibold",
                        dueSoon
                          ? "border-[#8c6425] bg-[#f4ebd7] text-[#8c6425]"
                          : "border-[#d9d1bf] bg-[#f9f4ea] text-[#625b4f]",
                      )}
                    >
                      {dueLabel}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <span className="rounded-full border border-[#d9d1bf] bg-[#f9f4ea] px-3 py-1 text-[11px] font-semibold capitalize text-[#625b4f]">
                      {item.tag}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => markReviewed(word)}
                        className="rounded-full border border-[#d9d1bf] bg-white/90 px-3 py-2 text-xs font-semibold text-[#191813] transition hover:border-[#9c8c63] hover:bg-white"
                      >
                        标记复习完成
                      </button>
                      <button
                        type="button"
                        onClick={() => removeFromQueue(word)}
                        className="rounded-full border border-[#d9d1bf] bg-white/90 px-3 py-2 text-xs font-semibold text-[#625b4f] transition hover:border-[#9c8c63] hover:bg-white hover:text-[#191813]"
                      >
                        移出队列
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {!reviewQueue.length ? (
              <div className="rounded-[24px] border border-dashed border-[#d9d1bf] bg-white/60 p-4 text-sm leading-7 text-[#625b4f]">
                收藏单词后，这里会自动成为你的复习清单。
              </div>
            ) : null}
          </div>
        </section>
      </section>
    </main>
  );
}

type PanelProps = {
  label: string;
  value: string;
  tone?: "default" | "warm";
};

function Panel({ label, value, tone = "default" }: PanelProps) {
  return (
    <div
      className={cn(
        "rounded-[30px] border p-4 sm:p-5",
        tone === "warm"
          ? "border-[#d9d1bf] bg-[#f9f4ea]"
          : "border-[#d9d1bf] bg-white/70",
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#7a705f]">
        {label}
      </p>
      <p className="mt-3 text-sm leading-7 text-[#191813]">{value}</p>
    </div>
  );
}
