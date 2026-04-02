import "server-only";

import path from "node:path";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { PRODUCTS } from "@/data/products";

type AdminOrderStatus = "new" | "processing" | "shipped" | "completed" | "cancelled";
type AdminLeadStatus = "new" | "contacted" | "qualified" | "closed";

type ServerAdminProduct = {
  id: string;
  name: string;
  category: string;
  categoryLabel: string;
  imagePath: string;
  imageAlt: string;
  price: number;
  badge: string;
  rating: number;
  shortDescription: string;
  benefits: string[];
  sku: string;
  stock: number;
  isActive: boolean;
  sales: number;
  updatedAt: string;
};

type ServerAdminOrder = {
  id: string;
  createdAt: string;
  customerName: string;
  phone: string;
  city: string;
  notes: string;
  source: "checkout" | "support";
  status: AdminOrderStatus;
  items: Array<{ productId: string; name: string; price: number; quantity: number; lineTotal: number }>;
  subtotal: number;
  deliveryFee: number;
  total: number;
};

type ServerAdminLead = {
  id: string;
  ticketNumber: string;
  createdAt: string;
  name: string;
  phone: string;
  profileType: string;
  notes: string;
  channel: "whatsapp" | "form";
  status: AdminLeadStatus;
  priority: "low" | "medium" | "high";
  selectedProductName?: string;
};

type ServerAdminAuditLog = {
  id: string;
  createdAt: string;
  actor: "owner" | "staff" | "support";
  action: string;
  entityType: "product" | "order" | "lead" | "settings" | "system";
  entityId?: string;
  details: string;
};

type ServerDashboardSettings = {
  whatsappNumber: string;
  lowStockThreshold: number;
  smartMode: boolean;
  adminPin: string;
};

export type ServerAdminState = {
  revision: number;
  updatedAt: string;
  products: ServerAdminProduct[];
  orders: ServerAdminOrder[];
  leads: ServerAdminLead[];
  settings: ServerDashboardSettings;
  auditLogs: ServerAdminAuditLog[];
};

const DEFAULT_DATA_DIR = path.join(/*turbopackIgnore: true*/ process.cwd(), "data");

function resolveDbPath() {
  const configuredPath = process.env.ADMIN_DB_PATH?.trim();
  if (configuredPath) {
    return path.isAbsolute(configuredPath)
      ? configuredPath
      : path.join(/*turbopackIgnore: true*/ process.cwd(), configuredPath);
  }
  return path.join(DEFAULT_DATA_DIR, "admin-db.json");
}

function resolveDbDir(dbPath: string) {
  return path.dirname(dbPath);
}

function getDefaultProducts(): ServerAdminProduct[] {
  return PRODUCTS.map((product, index) => ({
    ...product,
    sku: `SJ-${String(index + 1).padStart(4, "0")}`,
    stock: 12 + ((index * 7) % 18),
    isActive: true,
    sales: 20 + ((index * 13) % 60),
    updatedAt: new Date().toISOString(),
  }));
}

function defaultState(): ServerAdminState {
  return {
    revision: 1,
    updatedAt: new Date().toISOString(),
    products: getDefaultProducts(),
    orders: [],
    leads: [],
    settings: {
      whatsappNumber: "966500000000",
      lowStockThreshold: 8,
      smartMode: true,
      adminPin: "1234",
    },
    auditLogs: [],
  };
}

async function ensureDbFile() {
  const dbPath = resolveDbPath();
  const dbDir = resolveDbDir(dbPath);

  await mkdir(dbDir, { recursive: true });
  try {
    await readFile(dbPath, "utf8");
  } catch {
    await writeFile(dbPath, JSON.stringify(defaultState(), null, 2), "utf8");
  }
}

export async function readServerAdminState(): Promise<ServerAdminState> {
  await ensureDbFile();
  const dbPath = resolveDbPath();
  const raw = await readFile(dbPath, "utf8");

  try {
    const parsed = JSON.parse(raw) as Partial<ServerAdminState>;
    return {
      revision: Number.isFinite(Number(parsed.revision)) ? Number(parsed.revision) : 1,
      updatedAt: parsed.updatedAt || new Date().toISOString(),
      products: Array.isArray(parsed.products) ? parsed.products : getDefaultProducts(),
      orders: Array.isArray(parsed.orders) ? parsed.orders : [],
      leads: Array.isArray(parsed.leads) ? parsed.leads : [],
      settings: parsed.settings || defaultState().settings,
      auditLogs: Array.isArray(parsed.auditLogs) ? parsed.auditLogs : [],
    };
  } catch {
    const initial = defaultState();
    await writeServerAdminState(initial);
    return initial;
  }
}

export async function writeServerAdminState(state: ServerAdminState): Promise<void> {
  await ensureDbFile();
  const dbPath = resolveDbPath();
  await writeFile(dbPath, JSON.stringify(state, null, 2), "utf8");
}

export function bumpServerAdminStateRevision(state: ServerAdminState): ServerAdminState {
  return {
    ...state,
    revision: state.revision + 1,
    updatedAt: new Date().toISOString(),
  };
}
