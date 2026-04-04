import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  getAdminSessionCookieName,
  readAdminSessionRole,
  readAdminSessionRoleByPins,
  verifyAdminSessionTokenByPins,
  type AdminSessionRole,
} from "@/lib/admin-auth";
import {
  bumpServerAdminStateRevision,
  readServerAdminState,
  type ServerAdminState,
  writeServerAdminState,
} from "@/lib/server-admin-db";
import { adminStatePutPayloadSchema } from "@/lib/admin-state-schema";

function stableSerialize(value: unknown) {
  return JSON.stringify(value);
}

function toClientState(state: ServerAdminState) {
  return {
    ...state,
    settings: {
      ...state.settings,
      adminPin: "",
    },
  };
}

function pickList<T>(incoming: unknown, fallback: T[]): T[] {
  return Array.isArray(incoming) ? (incoming as T[]) : fallback;
}

function canUpdateSection(role: AdminSessionRole, section: "products" | "offers" | "orders" | "leads" | "settings" | "auditLogs") {
  if (role === "owner") {
    return true;
  }

  if (role === "staff") {
    return section !== "settings";
  }

  return section === "orders" || section === "leads" || section === "auditLogs";
}

function collectAdminPins(settings: { adminPin: string; adminUsers?: unknown }) {
  const pins = new Set<string>();
  pins.add(settings.adminPin);

  const users = Array.isArray(settings.adminUsers) ? settings.adminUsers : [];
  for (const user of users) {
    if (!user || typeof user !== "object") {
      continue;
    }
    const pin = String((user as Record<string, unknown>).pin || "").replace(/\D/g, "").trim();
    if (pin.length >= 4) {
      pins.add(pin);
    }
  }

  return [...pins];
}

export async function GET() {
  const state = await readServerAdminState();
  const cookieStore = await cookies();
  const token = cookieStore.get(getAdminSessionCookieName())?.value;
  const pins = collectAdminPins(state.settings);

  if (!verifyAdminSessionTokenByPins(token, pins)) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(toClientState(state));
}

export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies();
    const parsedPayload = adminStatePutPayloadSchema.safeParse(await request.json());
    if (!parsedPayload.success) {
      return NextResponse.json({ ok: false, message: "Invalid payload" }, { status: 400 });
    }
    const payload = parsedPayload.data;
    const previous = await readServerAdminState();
    const token = cookieStore.get(getAdminSessionCookieName())?.value;
    const pins = collectAdminPins(previous.settings);
    const role = readAdminSessionRoleByPins(token, pins) || readAdminSessionRole(token, previous.settings.adminPin);

    if (!verifyAdminSessionTokenByPins(token, pins) || !role) {
      return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
    }

    const baseRevision = payload.baseRevision;

    if (baseRevision !== previous.revision) {
      return NextResponse.json(
        {
          ok: false,
          conflict: true,
          message: "State conflict detected",
          state: toClientState(previous),
        },
        { status: 409 },
      );
    }

    const nextProducts = pickList(payload.products, previous.products);
    const nextOffers = pickList(payload.offers, previous.offers);
    const nextOrders = pickList(payload.orders, previous.orders);
    const nextLeads = pickList(payload.leads, previous.leads);
    const nextSettings = payload.settings && typeof payload.settings === "object"
      ? { ...previous.settings, ...payload.settings }
      : previous.settings;
    const nextAuditLogs = pickList(payload.auditLogs, previous.auditLogs);

    const changedSections: Array<"products" | "offers" | "orders" | "leads" | "settings" | "auditLogs"> = [];
    if (stableSerialize(nextProducts) !== stableSerialize(previous.products)) {
      changedSections.push("products");
    }
    if (stableSerialize(nextOffers) !== stableSerialize(previous.offers)) {
      changedSections.push("offers");
    }
    if (stableSerialize(nextOrders) !== stableSerialize(previous.orders)) {
      changedSections.push("orders");
    }
    if (stableSerialize(nextLeads) !== stableSerialize(previous.leads)) {
      changedSections.push("leads");
    }
    if (stableSerialize(nextSettings) !== stableSerialize(previous.settings)) {
      changedSections.push("settings");
    }
    if (stableSerialize(nextAuditLogs) !== stableSerialize(previous.auditLogs)) {
      changedSections.push("auditLogs");
    }

    const forbiddenSection = changedSections.find((section) => !canUpdateSection(role, section));
    if (forbiddenSection) {
      return NextResponse.json(
        {
          ok: false,
          message: "Forbidden",
          reason: `role_${role}_cannot_update_${forbiddenSection}`,
        },
        { status: 403 },
      );
    }

    const nextState = {
      revision: previous.revision,
      updatedAt: previous.updatedAt,
      products: nextProducts,
      offers: nextOffers,
      orders: nextOrders,
      leads: nextLeads,
      settings: nextSettings,
      auditLogs: nextAuditLogs,
    };

    const bumped = bumpServerAdminStateRevision(nextState);
    await writeServerAdminState(bumped);
    return NextResponse.json({ ok: true, state: toClientState(bumped) });
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid payload" }, { status: 400 });
  }
}
