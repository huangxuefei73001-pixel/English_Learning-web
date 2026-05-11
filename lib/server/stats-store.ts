import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import path from "node:path";

export type SiteStats = {
  totalVisits: number;
  uniqueVisitors: number;
  visitorIds: string[];
  updatedAt: string;
};

export const VISITOR_COOKIE = "wordislands_visitor";
export const VISITOR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

const STATS_FILE =
  process.env.WORD_ISLANDS_STATS_PATH ??
  path.join(process.cwd(), ".data", "word-islands-stats.json");

function emptyStats(): SiteStats {
  return {
    totalVisits: 0,
    uniqueVisitors: 0,
    visitorIds: [],
    updatedAt: new Date(0).toISOString(),
  };
}

function ensureStatsFile() {
  mkdirSync(path.dirname(STATS_FILE), { recursive: true });

  if (!existsSync(STATS_FILE)) {
    writeFileSync(STATS_FILE, JSON.stringify(emptyStats(), null, 2), "utf8");
  }
}

function writeStats(stats: SiteStats) {
  ensureStatsFile();
  const tempFile = `${STATS_FILE}.${process.pid}.${Date.now()}.tmp`;
  writeFileSync(tempFile, JSON.stringify(stats, null, 2), "utf8");
  renameSync(tempFile, STATS_FILE);
}

export function readStats(): SiteStats {
  ensureStatsFile();

  try {
    const parsed = JSON.parse(readFileSync(STATS_FILE, "utf8")) as Partial<SiteStats>;
    const visitorIds = Array.isArray(parsed.visitorIds)
      ? parsed.visitorIds.filter((item): item is string => typeof item === "string" && item.length > 0)
      : [];

    const uniqueVisitors =
      typeof parsed.uniqueVisitors === "number" && parsed.uniqueVisitors >= visitorIds.length
        ? parsed.uniqueVisitors
        : visitorIds.length;

    return {
      totalVisits: typeof parsed.totalVisits === "number" ? parsed.totalVisits : 0,
      uniqueVisitors,
      visitorIds,
      updatedAt:
        typeof parsed.updatedAt === "string" && parsed.updatedAt
          ? parsed.updatedAt
          : new Date().toISOString(),
    };
  } catch {
    return emptyStats();
  }
}

export function ensureVisitorId(existing: string | undefined) {
  const visitorId = existing?.trim() || randomBytes(16).toString("hex");

  return {
    visitorId,
    isNewCookie: !existing?.trim(),
  };
}

export function trackVisit(visitorId: string) {
  const stats = readStats();
  const hasVisitor = stats.visitorIds.includes(visitorId);

  const nextStats: SiteStats = {
    totalVisits: stats.totalVisits + 1,
    uniqueVisitors: hasVisitor ? stats.uniqueVisitors : stats.uniqueVisitors + 1,
    visitorIds: hasVisitor ? stats.visitorIds : [...stats.visitorIds, visitorId],
    updatedAt: new Date().toISOString(),
  };

  writeStats(nextStats);
  return nextStats;
}
