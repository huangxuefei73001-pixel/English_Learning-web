import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/server/api-auth";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ user: getCurrentUser() });
}
