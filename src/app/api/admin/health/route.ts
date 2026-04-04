import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getAdminSessionCookieName, verifyAdminSessionToken } from "@/lib/admin-auth";
import { getAdminPersistenceHealth, readServerAdminState } from "@/lib/server-admin-db";

export async function GET() {
  const state = await readServerAdminState();
  const cookieStore = await cookies();
  const token = cookieStore.get(getAdminSessionCookieName())?.value;

  if (!verifyAdminSessionToken(token, state.settings.adminPin)) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const persistence = await getAdminPersistenceHealth();
  return NextResponse.json({ ok: true, persistence });
}