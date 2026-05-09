import { NextResponse } from "next/server";

import type { StoredFavorite } from "@/lib/server/auth-store";
import { requireUser } from "@/lib/server/api-auth";
import { listFavorites, upsertFavorite } from "@/lib/server/auth-store";

export const runtime = "nodejs";

export async function GET() {
  const auth = requireUser();

  if (!auth.user) {
    return auth.response;
  }

  return NextResponse.json({ favorites: listFavorites(auth.user.id) });
}

export async function POST(request: Request) {
  const auth = requireUser();

  if (!auth.user) {
    return auth.response;
  }

  const body = (await request.json().catch(() => null)) as Partial<StoredFavorite> | null;

  if (!body?.word?.slug || !body.word.title) {
    return NextResponse.json({ error: "缺少有效的单词卡。" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const favorite: StoredFavorite = {
    word: body.word,
    savedAt: body.savedAt || now,
    note: body.note || body.word.memoryAids?.mnemonic || body.word.summary,
    tag: body.tag || body.word.usageLabels?.[0] || "neutral",
    streak: typeof body.streak === "number" && body.streak > 0 ? body.streak : 1,
    reviewedAt: body.reviewedAt || now,
    dueAt: body.dueAt || now,
  };

  return NextResponse.json({ favorite: upsertFavorite(auth.user.id, favorite) });
}
