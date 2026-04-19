import { useEffect, useState } from "react";

export type SearchHistoryEntry = {
  query: string;
  href: string;
  title?: string;
  savedAt: string;
  count: number;
};

const STORAGE_KEY = "lexicon-garden.search-history";
const EVENT_NAME = "lexicon-garden-search-history";
const MAX_ITEMS = 12;

function normalize(value: string) {
  return value.toLowerCase().trim().replace(/\s+/g, " ");
}

function safeParse(value: string | null): SearchHistoryEntry[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as SearchHistoryEntry[];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item) => typeof item?.query === "string" && typeof item?.href === "string");
  } catch {
    return [];
  }
}

export function readSearchHistory(): SearchHistoryEntry[] {
  if (typeof window === "undefined") {
    return [];
  }

  return safeParse(window.localStorage.getItem(STORAGE_KEY));
}

export function recordSearch(entry: Omit<SearchHistoryEntry, "savedAt" | "count">) {
  if (typeof window === "undefined") {
    return;
  }

  const current = safeParse(window.localStorage.getItem(STORAGE_KEY));
  const normalizedQuery = normalize(entry.query);
  const existingIndex = current.findIndex((item) => normalize(item.query) === normalizedQuery);
  const nextItem: SearchHistoryEntry = {
    ...entry,
    savedAt: new Date().toISOString(),
    count: 1,
  };

  let next = current.filter((item) => normalize(item.query) !== normalizedQuery);

  if (existingIndex >= 0) {
    const existing = current[existingIndex];
    nextItem.count = existing.count + 1;
  }

  next = [nextItem, ...next].slice(0, MAX_ITEMS);

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(EVENT_NAME));
}

export function clearSearchHistory() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(EVENT_NAME));
}

export function useSearchHistory(limit = MAX_ITEMS) {
  const [history, setHistory] = useState<SearchHistoryEntry[]>([]);

  useEffect(() => {
    const update = () => {
      setHistory(readSearchHistory().slice(0, limit));
    };

    update();
    window.addEventListener("storage", update);
    window.addEventListener(EVENT_NAME, update);

    return () => {
      window.removeEventListener("storage", update);
      window.removeEventListener(EVENT_NAME, update);
    };
  }, [limit]);

  return history;
}

export function formatHistoryTime(savedAt: string) {
  const date = new Date(savedAt);
  const now = Date.now();
  const diff = now - date.getTime();

  if (Number.isNaN(date.getTime()) || diff < 0) {
    return "just now";
  }

  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
