import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { deleteSession, SESSION_COOKIE } from "@/lib/server/auth-store";

export const runtime = "nodejs";

export async function POST() {
  const sessionId = cookies().get(SESSION_COOKIE)?.value;
  deleteSession(sessionId);

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return response;
}
