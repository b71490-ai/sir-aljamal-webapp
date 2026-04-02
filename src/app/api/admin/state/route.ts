import { NextResponse } from "next/server";
import {
  bumpServerAdminStateRevision,
  readServerAdminState,
  writeServerAdminState,
} from "@/lib/server-admin-db";

export async function GET() {
  const state = await readServerAdminState();
  return NextResponse.json(state);
}

export async function PUT(request: Request) {
  try {
    const payload = await request.json();
    const previous = await readServerAdminState();
    const baseRevision = Number(payload.baseRevision);

    if (!Number.isFinite(baseRevision)) {
      return NextResponse.json({ ok: false, message: "baseRevision is required" }, { status: 400 });
    }

    if (baseRevision !== previous.revision) {
      return NextResponse.json(
        {
          ok: false,
          conflict: true,
          message: "State conflict detected",
          state: previous,
        },
        { status: 409 },
      );
    }

    const nextState = {
      revision: previous.revision,
      updatedAt: previous.updatedAt,
      products: Array.isArray(payload.products) ? payload.products : previous.products,
      orders: Array.isArray(payload.orders) ? payload.orders : previous.orders,
      leads: Array.isArray(payload.leads) ? payload.leads : previous.leads,
      settings: payload.settings ? payload.settings : previous.settings,
      auditLogs: Array.isArray(payload.auditLogs) ? payload.auditLogs : previous.auditLogs,
    };

    const bumped = bumpServerAdminStateRevision(nextState);
    await writeServerAdminState(bumped);
    return NextResponse.json({ ok: true, state: bumped });
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid payload" }, { status: 400 });
  }
}
