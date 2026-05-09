import { NextResponse } from "next/server";

import {
  createSession,
  loginUser,
  SESSION_COOKIE,
  validateAuthInput,
} from "@/lib/server/auth-store";
import { sessionCookieOptions } from "@/lib/server/api-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { email?: unknown; password?: unknown }
    | null;
  const validation = validateAuthInput(body?.email, body?.password);

  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  try {
    const user = loginUser(validation.email, validation.password);
    const session = createSession(user.id);
    const response = NextResponse.json({ user });
    response.cookies.set(SESSION_COOKIE, session.id, sessionCookieOptions(session.expiresAt));
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "登录失败，请稍后再试。" },
      { status: 401 },
    );
  }
}
