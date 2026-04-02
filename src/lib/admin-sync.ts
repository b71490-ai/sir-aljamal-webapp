"use client";

import {
  applyAdminStateSnapshot,
  getAdminStateSnapshot,
  type AdminStateSnapshot,
} from "@/lib/admin-storage";

const ADMIN_STATE_API = "/api/admin/state";
const REVISION_KEY = "sir-aljamal-admin-server-revision";

type SyncStateResponse = {
  revision: number;
  updatedAt: string;
} & Partial<AdminStateSnapshot>;

function getKnownRevision() {
  if (typeof window === "undefined") {
    return 0;
  }
  return Number(window.localStorage.getItem(REVISION_KEY) || "0") || 0;
}

function setKnownRevision(revision: number) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(REVISION_KEY, String(revision));
}

function dedupeById<T extends { id: string }>(items: T[]) {
  const map = new Map<string, T>();
  items.forEach((item) => {
    map.set(item.id, item);
  });
  return [...map.values()];
}

function mergeConflict(server: Partial<AdminStateSnapshot>, local: AdminStateSnapshot): AdminStateSnapshot {
  return {
    products: dedupeById([...(server.products || []), ...local.products]),
    orders: dedupeById([...(server.orders || []), ...local.orders]),
    leads: dedupeById([...(server.leads || []), ...local.leads]),
    auditLogs: dedupeById([...(server.auditLogs || []), ...local.auditLogs]),
    settings: local.settings,
  };
}

export async function pullAdminStateFromServer(): Promise<boolean> {
  try {
    const response = await fetch(ADMIN_STATE_API, { method: "GET", cache: "no-store" });
    if (!response.ok) {
      return false;
    }

    const payload = (await response.json()) as SyncStateResponse;
    applyAdminStateSnapshot(payload);
    if (Number.isFinite(payload.revision)) {
      setKnownRevision(payload.revision);
    }
    return true;
  } catch {
    return false;
  }
}

export async function pushAdminStateToServer(): Promise<boolean> {
  try {
    const snapshot = getAdminStateSnapshot();
    const response = await fetch(ADMIN_STATE_API, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...snapshot,
        baseRevision: getKnownRevision(),
      }),
    });

    if (response.status === 409) {
      const conflictPayload = (await response.json()) as {
        conflict?: boolean;
        state?: SyncStateResponse;
      };
      if (!conflictPayload.state) {
        return false;
      }

      const merged = mergeConflict(conflictPayload.state, snapshot);
      applyAdminStateSnapshot(conflictPayload.state);
      setKnownRevision(conflictPayload.state.revision);

      const retryResponse = await fetch(ADMIN_STATE_API, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...merged,
          baseRevision: conflictPayload.state.revision,
        }),
      });

      if (!retryResponse.ok) {
        return false;
      }

      const retryPayload = (await retryResponse.json()) as { ok: boolean; state?: SyncStateResponse };
      if (retryPayload.state) {
        applyAdminStateSnapshot(retryPayload.state);
        setKnownRevision(retryPayload.state.revision);
      }

      return Boolean(retryPayload.ok);
    }

    if (!response.ok) {
      return false;
    }

    const payload = (await response.json()) as { ok: boolean; state?: SyncStateResponse };
    if (payload.state) {
      applyAdminStateSnapshot(payload.state);
      setKnownRevision(payload.state.revision);
    }
    return payload.ok;
  } catch {
    return false;
  }
}
