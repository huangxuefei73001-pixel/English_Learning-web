import { NextResponse } from "next/server";

import { requireUser } from "@/lib/server/api-auth";
import { deleteFavorite } from "@/lib/server/auth-store";

export const runtime = "nodejs";

export async function DELETE(
  _request: Request,
  { params }: { params: { slug: string } },
) {
  const auth = requireUser();

  if (!auth.user) {
    return auth.response;
  }

  deleteFavorite(auth.user.id, params.slug);
  return NextResponse.json({ ok: true });
}
