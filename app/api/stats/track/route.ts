import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  ensureVisitorId,
  trackVisit,
  VISITOR_COOKIE,
  VISITOR_COOKIE_MAX_AGE,
} from "@/lib/server/stats-store";

export const runtime = "nodejs";

export async function POST() {
  const existingVisitorId = cookies().get(VISITOR_COOKIE)?.value;
  const { visitorId, isNewCookie } = ensureVisitorId(existingVisitorId);
  const stats = trackVisit(visitorId);
  const response = NextResponse.json({ ok: true });

  if (isNewCookie) {
    response.cookies.set({
      name: VISITOR_COOKIE,
      value: visitorId,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: VISITOR_COOKIE_MAX_AGE,
    });
  }

  response.headers.set("Cache-Control", "no-store");

  return response;
}
