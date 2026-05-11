import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/server/api-auth";
import { countRegisteredUsers } from "@/lib/server/auth-store";
import { readStats } from "@/lib/server/stats-store";

export const runtime = "nodejs";

export async function GET() {
  const { response } = requireAdmin();

  if (response) {
    return response;
  }

  const stats = readStats();

  return NextResponse.json({
    totalVisits: stats.totalVisits,
    uniqueVisitors: stats.uniqueVisitors,
    registeredUsers: countRegisteredUsers(),
  });
}
