import "server-only";

import path from "node:path";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import { PRODUCTS } from "@/data/products";

type AdminOrderStatus = "new" | "processing" | "shipped" | "completed" | "cancelled";
type AdminOrderPaymentStatus = "pending_transfer" | "under_review" | "paid" | "rejected";
type AdminLeadStatus = "new" | "contacted" | "qualified" | "closed";

type ServerAdminProduct = {
  id: string;
  name: string;
  category: string;
  categoryLabel: string;
  imagePath: string;
  imageGallery: string[];
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

type ServerAdminOfferRule = {
  minSubtotal?: number;
  category?: string;
  productIds?: string[];
};

type ServerAdminOffer = {
  id: string;
  title: string;
  details: string;
  expiresAt: string;
  href: string;
  badge: string;
  rule: ServerAdminOfferRule;
  discountPercent?: number;
  discountFixed?: number;
  freeShipping?: boolean;
  couponCode?: string;
  isEnabled: boolean;
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
  paymentStatus: AdminOrderPaymentStatus;
  paymentMethodId: string;
  paymentMethodLabel: string;
  paymentReference: string;
  payerName: string;
  paymentReceiptImage?: string;
  items: Array<{ productId: string; name: string; price: number; quantity: number; lineTotal: number }>;
  subtotal: number;
  deliveryFee: number;
  total: number;
};

type ServerPaymentMethod = {
  id: string;
  name: string;
  provider: string;
  accountName: string;
  accountNumber: string;
  instructions: string;
  isEnabled: boolean;
};

type ServerAdminUser = {
  id: string;
  name: string;
  username: string;
  pin: string;
  role: "owner" | "staff" | "support";
  isEnabled: boolean;
  lastLoginAt?: string;
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
  supportEmail: string;
  brandLogoPath: string;
  footerContactTitle: string;
  workingHoursLabel: string;
  currencyCode: "SAR" | "YER" | "USD";
  currencySymbol: string;
  lowStockThreshold: number;
  smartMode: boolean;
  adminPin: string;
  walletName: string;
  walletAccountNumber: string;
  paymentMethods: ServerPaymentMethod[];
  adminUsers: ServerAdminUser[];
};

export type ServerAdminState = {
  revision: number;
  updatedAt: string;
  products: ServerAdminProduct[];
  offers: ServerAdminOffer[];
  orders: ServerAdminOrder[];
  leads: ServerAdminLead[];
  settings: ServerDashboardSettings;
  auditLogs: ServerAdminAuditLog[];
};

const DEFAULT_DATA_DIR = path.join(/*turbopackIgnore: true*/ process.cwd(), "data");
const SUPABASE_TABLE = process.env.SUPABASE_ADMIN_STATE_TABLE || "admin_state";
const SUPABASE_ROW_ID = "default";

function resolveFallbackDbPath() {
  return path.join(DEFAULT_DATA_DIR, "admin-db.json");
}

export type AdminPersistenceHealth = {
  mode: "supabase" | "file";
  supabaseConfigured: boolean;
  supabaseReady: boolean;
};

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return null;
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

function usesSupabase() {
  return Boolean(getSupabaseClient());
}

function resolveDbPath() {
  const configuredPath = process.env.ADMIN_DB_PATH?.trim();
  if (configuredPath) {
    return path.isAbsolute(configuredPath)
      ? configuredPath
      : path.join(/*turbopackIgnore: true*/ process.cwd(), configuredPath);
  }
  return resolveFallbackDbPath();
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
    offers: [
      {
        id: "welcome-35",
        title: "خصم 35% على مختارات البشرة",
        details: "خصم تلقائي على منتجات العناية بالبشرة حتى نهاية اليوم.",
        expiresAt: "2026-12-31T21:59:59.000Z",
        href: "/store?category=skin-care",
        badge: "عرض تلقائي",
        rule: { category: "skin-care", minSubtotal: 80 },
        discountPercent: 35,
        isEnabled: true,
      },
      {
        id: "makeup-bundle",
        title: "خصم 25% على المكياج",
        details: "عند شراء أي منتجين من قسم المكياج يتم تطبيق خصم تلقائي.",
        expiresAt: "2026-12-30T21:59:59.000Z",
        href: "/store?category=makeup",
        badge: "لفترة محدودة",
        rule: { category: "makeup" },
        discountPercent: 25,
        isEnabled: true,
      },
      {
        id: "free-shipping-79",
        title: "شحن مجاني فوق 79 ر.س",
        details: "الشحن يصبح مجانيًا تلقائيًا عند تجاوز الحد الأدنى.",
        expiresAt: "2026-12-31T21:59:59.000Z",
        href: "/checkout",
        badge: "مباشر",
        rule: { minSubtotal: 79 },
        freeShipping: true,
        isEnabled: true,
      },
      {
        id: "coupon-glow10",
        title: "كود GLOW10",
        details: "خصم 10% على كامل السلة باستخدام الكود.",
        expiresAt: "2026-12-31T21:59:59.000Z",
        href: "/checkout",
        badge: "كوبون",
        rule: { minSubtotal: 120 },
        discountPercent: 10,
        couponCode: "GLOW10",
        isEnabled: true,
      },
    ],
    orders: [],
    leads: [],
    settings: {
      whatsappNumber: "966500000000",
      supportEmail: "support@siraljamal.sa",
      brandLogoPath: "/brand/sir-aljamal-logo.svg",
      footerContactTitle: "أتيلية العطر",
      workingHoursLabel: "يوميًا من 10 صباحًا حتى 11 مساءً",
      currencyCode: "SAR",
      currencySymbol: "ر.س",
      lowStockThreshold: 8,
      smartMode: true,
      adminPin: "1234",
      walletName: "المحفظة الرئيسية",
      walletAccountNumber: "777123456",
      paymentMethods: [
        {
          id: "jeeb",
          name: "جيب",
          provider: "محفظة جيب",
          accountName: "متجر سر الجمال",
          accountNumber: "777123456",
          instructions: "حوّلي المبلغ كاملًا ثم اكتبي رقم العملية أو المرجع كما ظهر لك في التطبيق.",
          isEnabled: true,
        },
        {
          id: "jawali",
          name: "جوالي",
          provider: "محفظة جوالي",
          accountName: "متجر سر الجمال",
          accountNumber: "771234567",
          instructions: "بعد التحويل عبر جوالي أدخلي اسم المحوّل ورقم المرجع لتأكيد الطلب بسرعة.",
          isEnabled: true,
        },
        {
          id: "kuraimi",
          name: "الكريمي",
          provider: "الكريمي / موبايل موني",
          accountName: "متجر سر الجمال",
          accountNumber: "3400123456",
          instructions: "يمكنك التحويل من تطبيق الكريمي أو أي فرع ثم تدوين رقم الحوالة في الحقل المخصص.",
          isEnabled: true,
        },
        {
          id: "flousak",
          name: "فلوسك",
          provider: "محفظة فلوسك",
          accountName: "متجر سر الجمال",
          accountNumber: "780123456",
          instructions: "حوّلي المبلغ عبر تطبيق فلوسك ثم اكتبي اسم المحوّل ورقم المرجع لتأكيد الطلب.",
          isEnabled: true,
        },
      ],
      adminUsers: [
        {
          id: "user-owner",
          name: "المالك",
          username: "owner",
          pin: "1234",
          role: "owner",
          isEnabled: true,
        },
        {
          id: "user-staff",
          name: "موظف",
          username: "staff",
          pin: "1234",
          role: "staff",
          isEnabled: true,
        },
        {
          id: "user-support",
          name: "الدعم",
          username: "support",
          pin: "1234",
          role: "support",
          isEnabled: true,
        },
      ],
    },
    auditLogs: [],
  };
}

async function ensureDbFileAtPath(dbPath: string) {
  const dbDir = resolveDbDir(dbPath);

  await mkdir(dbDir, { recursive: true });
  try {
    await readFile(dbPath, "utf8");
  } catch {
    await writeFile(dbPath, JSON.stringify(defaultState(), null, 2), "utf8");
  }

  return dbPath;
}

async function resolveUsableDbPath() {
  const primaryPath = resolveDbPath();

  try {
    return await ensureDbFileAtPath(primaryPath);
  } catch {
    const fallbackPath = resolveFallbackDbPath();
    if (fallbackPath === primaryPath) {
      throw new Error(`Unable to initialize admin db at ${primaryPath}`);
    }

    return ensureDbFileAtPath(fallbackPath);
  }
}

async function ensureSupabaseRow() {
  const client = getSupabaseClient();
  if (!client) {
    return false;
  }

  const { data, error } = await client
    .from(SUPABASE_TABLE)
    .select("id,payload")
    .eq("id", SUPABASE_ROW_ID)
    .maybeSingle();

  if (error) {
    return false;
  }

  if (!data) {
    const initial = defaultState();
    const { error: insertError } = await client
      .from(SUPABASE_TABLE)
      .upsert({ id: SUPABASE_ROW_ID, payload: initial, updated_at: new Date().toISOString() });
    return !insertError;
  }

  return true;
}

export async function getAdminPersistenceHealth(): Promise<AdminPersistenceHealth> {
  const configured = usesSupabase();
  if (!configured) {
    return {
      mode: "file",
      supabaseConfigured: false,
      supabaseReady: false,
    };
  }

  const ready = await ensureSupabaseRow();
  return {
    mode: ready ? "supabase" : "file",
    supabaseConfigured: true,
    supabaseReady: ready,
  };
}

async function readSupabaseState(): Promise<ServerAdminState | null> {
  const client = getSupabaseClient();
  if (!client) {
    return null;
  }

  const ok = await ensureSupabaseRow();
  if (!ok) {
    return null;
  }

  const { data, error } = await client
    .from(SUPABASE_TABLE)
    .select("payload")
    .eq("id", SUPABASE_ROW_ID)
    .single();

  if (error || !data?.payload) {
    return null;
  }

  const parsed = data.payload as Partial<ServerAdminState>;
  return {
    revision: Number.isFinite(Number(parsed.revision)) ? Number(parsed.revision) : 1,
    updatedAt: parsed.updatedAt || new Date().toISOString(),
    products: Array.isArray(parsed.products) ? parsed.products : getDefaultProducts(),
    offers: Array.isArray(parsed.offers) ? parsed.offers : defaultState().offers,
    orders: Array.isArray(parsed.orders) ? parsed.orders : [],
    leads: Array.isArray(parsed.leads) ? parsed.leads : [],
    settings: parsed.settings || defaultState().settings,
    auditLogs: Array.isArray(parsed.auditLogs) ? parsed.auditLogs : [],
  };
}

async function writeSupabaseState(state: ServerAdminState): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) {
    return false;
  }

  const { error } = await client
    .from(SUPABASE_TABLE)
    .upsert({ id: SUPABASE_ROW_ID, payload: state, updated_at: new Date().toISOString() });

  return !error;
}

export async function readServerAdminState(): Promise<ServerAdminState> {
  if (usesSupabase()) {
    const supabaseState = await readSupabaseState();
    if (supabaseState) {
      return supabaseState;
    }
  }

  const dbPath = await resolveUsableDbPath();
  const raw = await readFile(dbPath, "utf8");

  try {
    const parsed = JSON.parse(raw) as Partial<ServerAdminState>;
    return {
      revision: Number.isFinite(Number(parsed.revision)) ? Number(parsed.revision) : 1,
      updatedAt: parsed.updatedAt || new Date().toISOString(),
      products: Array.isArray(parsed.products) ? parsed.products : getDefaultProducts(),
      offers: Array.isArray(parsed.offers) ? parsed.offers : defaultState().offers,
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
  if (usesSupabase()) {
    const ok = await writeSupabaseState(state);
    if (ok) {
      return;
    }
  }

  const dbPath = await resolveUsableDbPath();
  await writeFile(dbPath, JSON.stringify(state, null, 2), "utf8");
}

export function bumpServerAdminStateRevision(state: ServerAdminState): ServerAdminState {
  return {
    ...state,
    revision: state.revision + 1,
    updatedAt: new Date().toISOString(),
  };
}
