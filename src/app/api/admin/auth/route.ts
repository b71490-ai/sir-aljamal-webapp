import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  type AdminSessionRole,
  createAdminSessionToken,
  getAdminSessionCookieName,
  isAdminSessionRole,
  readAdminSessionRole,
  verifyAdminSessionToken,
} from "@/lib/admin-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { readServerAdminState } from "@/lib/server-admin-db";

export async function GET() {
  const state = await readServerAdminState();
  const cookieStore = await cookies();
  const token = cookieStore.get(getAdminSessionCookieName())?.value;
  const isAuthenticated = verifyAdminSessionToken(token, state.settings.adminPin);
  const role = readAdminSessionRole(token, state.settings.adminPin);

  return NextResponse.json({ ok: true, isAuthenticated, role: isAuthenticated ? role : null });
}

export async function POST(request: Request) {
  try {
    const rate = checkRateLimit(request, "admin-auth", 7, 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json(
        { ok: false, message: "Too many attempts. Please try again shortly." },
        {
          status: 429,
          headers: { "Retry-After": String(rate.retryAfter) },
        },
      );
    }

    const payload = (await request.json()) as { pin?: string; role?: string };
    const pin = String(payload.pin || "").trim();
    const requestedRole = String(payload.role || "").trim();
    const role: AdminSessionRole = isAdminSessionRole(requestedRole) ? requestedRole : "staff";
    const state = await readServerAdminState();

    if (!pin || pin !== state.settings.adminPin) {
      return NextResponse.json({ ok: false, message: "رمز الدخول غير صحيح" }, { status: 401 });
    }

    const token = createAdminSessionToken(pin, role);
    const response = NextResponse.json({ ok: true });
    response.cookies.set(getAdminSessionCookieName(), token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 12,
    });

    return response;
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid payload" }, { status: 400 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(getAdminSessionCookieName(), "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}
