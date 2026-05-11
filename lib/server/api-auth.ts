import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getUserBySession, SESSION_COOKIE } from "@/lib/server/auth-store";

export function getCurrentUser() {
  const sessionId = cookies().get(SESSION_COOKIE)?.value;
  return getUserBySession(sessionId);
}

export function requireUser() {
  const user = getCurrentUser();

  if (!user) {
    return {
      user: null,
      response: NextResponse.json({ error: "请先登录后再保存收藏。" }, { status: 401 }),
    };
  }

  return { user, response: null };
}

export function requireAdmin() {
  const user = getCurrentUser();

  if (!user?.isAdmin) {
    return {
      user: null,
      response: NextResponse.json({ error: "无权限查看站点统计。" }, { status: 403 }),
    };
  }

  return { user, response: null };
}

export function sessionCookieOptions(expires: Date) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  };
}
