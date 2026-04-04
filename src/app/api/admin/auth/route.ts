import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  type AdminSessionRole,
  createAdminSessionToken,
  getAdminSessionCookieName,
  isAdminSessionRole,
  readAdminSessionRole,
  readAdminSessionRoleByPins,
  verifyAdminSessionTokenByPins,
} from "@/lib/admin-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { readServerAdminState } from "@/lib/server-admin-db";

type AdminUser = {
  id: string;
  username: string;
  pin: string;
  role: AdminSessionRole;
  isEnabled: boolean;
};

function getConfiguredUsers(settings: { adminPin: string; adminUsers?: unknown }): AdminUser[] {
  const users = Array.isArray(settings.adminUsers) ? settings.adminUsers : [];
  const normalized = users
    .map((user, index) => {
      if (!user || typeof user !== "object") {
        return null;
      }

      const record = user as Record<string, unknown>;
      const role = isAdminSessionRole(String(record.role || "")) ? (record.role as AdminSessionRole) : "staff";
      const username = String(record.username || "")
        .toLowerCase()
        .replace(/[^a-z0-9._-]/g, "")
        .trim();
      const pin = String(record.pin || "").replace(/\D/g, "").trim();

      if (!username || pin.length < 4) {
        return null;
      }

      return {
        id: String(record.id || `user-${index + 1}`),
        username,
        pin,
        role,
        isEnabled: record.isEnabled !== false,
      };
    })
    .filter((user): user is AdminUser => Boolean(user));

  if (normalized.length > 0) {
    return normalized;
  }

  return [
    {
      id: "legacy-owner",
      username: "owner",
      pin: settings.adminPin,
      role: "owner",
      isEnabled: true,
    },
  ];
}

export async function GET() {
  const state = await readServerAdminState();
  const cookieStore = await cookies();
  const token = cookieStore.get(getAdminSessionCookieName())?.value;
  const users = getConfiguredUsers(state.settings);
  const pins = [state.settings.adminPin, ...users.map((user) => user.pin)];
  const isAuthenticated = verifyAdminSessionTokenByPins(token, pins);
  const role = readAdminSessionRoleByPins(token, pins) || readAdminSessionRole(token, state.settings.adminPin);

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

    const payload = (await request.json()) as { pin?: string; role?: string; username?: string };
    const pin = String(payload.pin || "").trim();
    const requestedRole = String(payload.role || "").trim();
    const username = String(payload.username || "")
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, "")
      .trim();
    const role: AdminSessionRole = isAdminSessionRole(requestedRole) ? requestedRole : "staff";
    const state = await readServerAdminState();
    const users = getConfiguredUsers(state.settings);
    const matchedUser = users.find((user) => user.isEnabled && user.username === username && user.pin === pin);

    if (matchedUser) {
      const token = createAdminSessionToken(matchedUser.pin, matchedUser.role);
      const response = NextResponse.json({ ok: true, role: matchedUser.role });
      response.cookies.set(getAdminSessionCookieName(), token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 12,
      });

      return response;
    }

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
