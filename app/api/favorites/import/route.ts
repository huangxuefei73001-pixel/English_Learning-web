import { NextResponse } from "next/server";

import type { StoredFavorite } from "@/lib/server/auth-store";
import { requireUser } from "@/lib/server/api-auth";
import { importFavorites } from "@/lib/server/auth-store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = requireUser();

  if (!auth.user) {
    return auth.response;
  }

  if (!auth.user.isAdmin) {
    return NextResponse.json({ error: "只有管理员账号可以导入旧收藏。" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as
    | { favorites?: Array<Partial<StoredFavorite>> }
    | null;
  const favorites = Array.isArray(body?.favorites) ? body.favorites : [];
  const validFavorites = favorites.filter(
    (item): item is StoredFavorite => Boolean(item.word?.slug && item.word.title),
  );

  const imported = importFavorites(auth.user.id, validFavorites);
  return NextResponse.json({ favorites: imported, importedCount: validFavorites.length });
}
