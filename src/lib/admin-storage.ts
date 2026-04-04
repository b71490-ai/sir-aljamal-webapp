"use client";

import { CATEGORY_LABELS, PRODUCTS, type Product, type ProductCategory } from "@/data/products";
import { normalizeToEnglishDigits } from "@/lib/digits";

export type AdminOfferRule = {
  minSubtotal?: number;
  category?: ProductCategory;
  productIds?: string[];
};

export type AdminOffer = {
  id: string;
  title: string;
  details: string;
  expiresAt: string;
  href: string;
  badge: string;
  rule: AdminOfferRule;
  discountPercent?: number;
  discountFixed?: number;
  freeShipping?: boolean;
  couponCode?: string;
  isEnabled: boolean;
};

export type AdminProduct = Product & {
  sku: string;
  stock: number;
  isActive: boolean;
  sales: number;
  updatedAt: string;
};

export type AdminOrderItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  lineTotal: number;
};

export type AdminOrderStatus = "new" | "processing" | "shipped" | "completed" | "cancelled";
export type AdminOrderPaymentStatus = "pending_transfer" | "under_review" | "paid" | "rejected";
export type AdminLeadStatus = "new" | "contacted" | "qualified" | "closed";
export type AdminRole = "owner" | "staff" | "support";

export type AdminPaymentMethod = {
  id: string;
  name: string;
  provider: string;
  accountName: string;
  accountNumber: string;
  instructions: string;
  isEnabled: boolean;
};

export type AdminUserAccount = {
  id: string;
  name: string;
  username: string;
  pin: string;
  role: AdminRole;
  isEnabled: boolean;
  lastLoginAt?: string;
};

export type AdminOrder = {
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
  items: AdminOrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
};

export type AdminLead = {
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

export type AdminAuditLog = {
  id: string;
  createdAt: string;
  actor: AdminRole;
  action: string;
  entityType: "product" | "order" | "lead" | "settings" | "system";
  entityId?: string;
  details: string;
};

export type DashboardSettings = {
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
  paymentMethods: AdminPaymentMethod[];
  adminUsers: AdminUserAccount[];
};

export type DashboardInsights = {
  revenue: number;
  ordersCount: number;
  avgOrderValue: number;
  pendingOrders: number;
  lowStockProducts: number;
  conversionRate: number;
  topProductName: string;
  recommendations: string[];
};

export type AdminStateSnapshot = {
  products: AdminProduct[];
  offers: AdminOffer[];
  orders: AdminOrder[];
  leads: AdminLead[];
  settings: DashboardSettings;
  auditLogs: AdminAuditLog[];
};

const STORAGE_KEYS = {
  products: "sir-aljamal-admin-products",
  offers: "sir-aljamal-admin-offers",
  orders: "sir-aljamal-admin-orders",
  leads: "sir-aljamal-admin-leads",
  settings: "sir-aljamal-admin-settings",
  audit: "sir-aljamal-admin-audit",
} as const;

const DEFAULT_SETTINGS: DashboardSettings = {
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
};

function sanitizeRole(value: unknown): AdminRole {
  if (value === "owner" || value === "staff" || value === "support") {
    return value;
  }
  return "staff";
}

function sanitizeAdminUsers(users: AdminUserAccount[] | undefined): AdminUserAccount[] {
  const fallback = DEFAULT_SETTINGS.adminUsers;
  if (!Array.isArray(users) || users.length === 0) {
    return fallback;
  }

  const normalized = users
    .map((user, index) => {
      const role = sanitizeRole(user.role);
      const fallbackUser = fallback[index] || fallback[1] || fallback[0];
      const username = String(user.username || "")
        .toLowerCase()
        .replace(/[^a-z0-9._-]/g, "")
        .trim();
      const pin = String(user.pin || "")
        .replace(/\D/g, "")
        .slice(0, 32);

      return {
        id: String(user.id || fallbackUser.id || `user-${Date.now()}-${index}`),
        name: String(user.name || fallbackUser.name || "مستخدم").trim() || "مستخدم",
        username: username || String(fallbackUser.username || `user${index + 1}`),
        pin: pin.length >= 4 ? pin : String(fallbackUser.pin || DEFAULT_SETTINGS.adminPin),
        role,
        isEnabled: user.isEnabled !== false,
        lastLoginAt: user.lastLoginAt ? String(user.lastLoginAt) : undefined,
      };
    })
    .slice(0, 30)
    .filter((user, index, arr) => arr.findIndex((item) => item.username === user.username) === index);

  const hasEnabledOwner = normalized.some((user) => user.role === "owner" && user.isEnabled);
  if (!hasEnabledOwner) {
    const ownerFallback = fallback[0];
    normalized.unshift({
      ...ownerFallback,
      id: ownerFallback.id || `user-owner-${Date.now()}`,
      isEnabled: true,
      lastLoginAt: ownerFallback.lastLoginAt || undefined,
    });
  }

  return normalized;
}

function sanitizePaymentMethods(methods: AdminPaymentMethod[] | undefined): AdminPaymentMethod[] {
  const fallback = DEFAULT_SETTINGS.paymentMethods;
  if (!Array.isArray(methods) || methods.length === 0) {
    return fallback;
  }

  return methods
    .map((method, index) => ({
      id: String(method.id || fallback[index]?.id || `payment-${Date.now()}-${index}`),
      name: String(method.name || fallback[index]?.name || "وسيلة دفع").trim() || "وسيلة دفع",
      provider: String(method.provider || fallback[index]?.provider || "تحويل").trim() || "تحويل",
      accountName: String(method.accountName || "").trim(),
      accountNumber: String(method.accountNumber || "").trim(),
      instructions: String(method.instructions || "").trim(),
      isEnabled: method.isEnabled !== false,
    }))
    .filter((method) => method.accountName && method.accountNumber)
    .slice(0, 10);
}

function sanitizeCurrencyCode(code: unknown): DashboardSettings["currencyCode"] {
  if (code === "YER" || code === "USD" || code === "SAR") {
    return code;
  }
  return "SAR";
}

function sanitizeCurrencySymbol(symbol: unknown, code: DashboardSettings["currencyCode"]) {
  const value = String(symbol || "").trim();
  if (value) {
    return value.slice(0, 8);
  }

  if (code === "YER") {
    return "ر.ي";
  }
  if (code === "USD") {
    return "$";
  }
  return "ر.س";
}

function sanitizeBrandLogoPath(value: unknown) {
  const raw = String(value || "").trim();
  if (!raw) {
    return DEFAULT_SETTINGS.brandLogoPath;
  }

  if (raw.startsWith("/")) {
    return raw;
  }

  if (raw.startsWith("brand/")) {
    return `/${raw}`;
  }

  if (raw.startsWith("data:image/")) {
    return raw;
  }

  return DEFAULT_SETTINGS.brandLogoPath;
}

const DEFAULT_OFFERS: AdminOffer[] = [
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
];

function hasWindow() {
  return typeof window !== "undefined";
}

function readStorage<T>(key: string, fallback: T): T {
  if (!hasWindow()) {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T) {
  if (!hasWindow()) {
    return;
  }
  window.localStorage.setItem(key, JSON.stringify(value));
}

function sanitizeSnapshotList<T>(value: unknown, maxItems = 5000): T[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item) => typeof item === "object" && item !== null)
    .slice(0, maxItems) as T[];
}

function toCsvCell(value: unknown) {
  let text = String(value ?? "");
  if (/^[=+\-@]/.test(text)) {
    text = `'${text}`;
  }

  if (text.includes('"')) {
    text = text.replace(/"/g, '""');
  }

  if (/[",\n]/.test(text)) {
    text = `"${text}"`;
  }

  return text;
}

function toCsvRow(values: unknown[]) {
  return values.map((value) => toCsvCell(value)).join(",");
}

function toAdminProduct(product: Product, index: number): AdminProduct {
  return {
    ...product,
    sku: `SJ-${String(index + 1).padStart(4, "0")}`,
    stock: 12 + ((index * 7) % 18),
    isActive: true,
    sales: 20 + ((index * 13) % 60),
    updatedAt: new Date().toISOString(),
  };
}

function defaultProducts(): AdminProduct[] {
  return PRODUCTS.map((product, index) => toAdminProduct(product, index));
}

function sanitizeOfferRule(rule: Partial<AdminOfferRule> | undefined): AdminOfferRule {
  const next: AdminOfferRule = {};

  if (Number.isFinite(Number(rule?.minSubtotal)) && Number(rule?.minSubtotal) > 0) {
    next.minSubtotal = Number(rule?.minSubtotal);
  }

  if (rule?.category && (Object.keys(CATEGORY_LABELS) as ProductCategory[]).includes(rule.category)) {
    next.category = rule.category;
  }

  if (Array.isArray(rule?.productIds)) {
    const ids = rule.productIds.map((item) => String(item || "").trim()).filter(Boolean);
    if (ids.length > 0) {
      next.productIds = ids.slice(0, 20);
    }
  }

  return next;
}

function sanitizeOffers(offers: AdminOffer[]): AdminOffer[] {
  const normalized: AdminOffer[] = [];

  offers.forEach((offer, index) => {
    const fallback = DEFAULT_OFFERS[index] || DEFAULT_OFFERS[0];
    const title = String(offer.title || "").trim();
    const details = String(offer.details || "").trim();
    const href = String(offer.href || "").trim();

    if (!title || !details || !href) {
      return;
    }

    normalized.push({
      id: String(offer.id || `offer-${Date.now()}-${index}`),
      title,
      details,
      expiresAt: offer.expiresAt || fallback.expiresAt,
      href,
      badge: String(offer.badge || fallback.badge || "عرض خاص").trim() || "عرض خاص",
      rule: sanitizeOfferRule(offer.rule),
      discountPercent: Number.isFinite(Number(offer.discountPercent)) ? Math.max(0, Number(offer.discountPercent)) : undefined,
      discountFixed: Number.isFinite(Number(offer.discountFixed)) ? Math.max(0, Number(offer.discountFixed)) : undefined,
      freeShipping: Boolean(offer.freeShipping),
      couponCode: String(offer.couponCode || "").trim().toUpperCase() || undefined,
      isEnabled: offer.isEnabled !== false,
    });
  });

  return normalized;
}

function normalizeCategory(value: string | undefined, fallback: ProductCategory): ProductCategory {
  const categories = Object.keys(CATEGORY_LABELS) as ProductCategory[];
  if (value && categories.includes(value as ProductCategory)) {
    return value as ProductCategory;
  }
  return fallback;
}

function fallbackProductFromInput(product: Partial<AdminProduct>): Product | null {
  const id = String(product.id || "").trim();
  if (!id) {
    return null;
  }

  const category = normalizeCategory(String(product.category || ""), "skin-care");
  const imagePath = String(product.imagePath || "").trim() || "/products/vitamin-c-serum.svg";

  return {
    id,
    name: String(product.name || "منتج جديد").trim() || "منتج جديد",
    category,
    categoryLabel: CATEGORY_LABELS[category],
    imagePath,
    imageGallery: [imagePath],
    imageAlt: String(product.imageAlt || "صورة المنتج").trim() || "صورة المنتج",
    price: Number(product.price) > 0 ? Number(product.price) : 99,
    badge: String(product.badge || "جديد").trim() || "جديد",
    rating: Number.isFinite(Number(product.rating)) ? Math.max(1, Math.min(5, Number(product.rating))) : 4.5,
    shortDescription: String(product.shortDescription || "وصف المنتج").trim() || "وصف المنتج",
    benefits: Array.isArray(product.benefits) && product.benefits.length > 0
      ? product.benefits.map((item) => String(item || "").trim()).filter(Boolean)
      : ["ميزة أساسية للمنتج"],
  };
}

function normalizeImageGallery(product: Partial<Product>, fallback: Product): string[] {
  const raw = Array.isArray(product.imageGallery) ? product.imageGallery : [];
  const trimmed = raw.map((item) => String(item || "").trim()).filter(Boolean);
  if (trimmed.length > 0) {
    return trimmed;
  }

  const legacyMain = String(product.imagePath || "").trim();
  if (legacyMain) {
    return [legacyMain];
  }

  return [fallback.imagePath];
}

function sanitizeProducts(products: AdminProduct[]): AdminProduct[] {
  const fallbackMap = new Map(defaultProducts().map((item) => [item.id, item]));

  return products
    .map((product, index) => {
      const generatedFallback = fallbackProductFromInput(product);
      const fallback = fallbackMap.get(product.id) ?? (generatedFallback ? toAdminProduct(generatedFallback, index) : null);
      if (!fallback) {
        return null;
      }

      const imageGallery = normalizeImageGallery(product, fallback);

      return {
        ...fallback,
        ...product,
        imageGallery,
        imagePath: imageGallery[0],
        imageAlt: String(product.imageAlt || fallback.imageAlt),
        price: Number(product.price) > 0 ? Number(product.price) : fallback.price,
        stock: Number.isFinite(Number(product.stock)) ? Math.max(0, Number(product.stock)) : fallback.stock,
        sales: Number.isFinite(Number(product.sales)) ? Math.max(0, Number(product.sales)) : fallback.sales,
        updatedAt: product.updatedAt || fallback.updatedAt,
      };
    })
    .filter((product): product is AdminProduct => Boolean(product));
}

export function getAdminProducts(): AdminProduct[] {
  const stored = readStorage<AdminProduct[] | null>(STORAGE_KEYS.products, null);
  if (!stored || !Array.isArray(stored) || stored.length === 0) {
    const seeded = defaultProducts();
    writeStorage(STORAGE_KEYS.products, seeded);
    return seeded;
  }

  const normalized = sanitizeProducts(stored);
  if (normalized.length === 0) {
    const seeded = defaultProducts();
    writeStorage(STORAGE_KEYS.products, seeded);
    return seeded;
  }

  return normalized;
}

export function saveAdminProducts(products: AdminProduct[]) {
  const normalized = sanitizeProducts(products);
  writeStorage(STORAGE_KEYS.products, normalized);
}

export function getAdminOffers(): AdminOffer[] {
  const stored = readStorage<AdminOffer[] | null>(STORAGE_KEYS.offers, null);
  if (!stored || !Array.isArray(stored) || stored.length === 0) {
    writeStorage(STORAGE_KEYS.offers, DEFAULT_OFFERS);
    return DEFAULT_OFFERS;
  }

  const normalized = sanitizeOffers(stored);
  if (normalized.length === 0) {
    writeStorage(STORAGE_KEYS.offers, DEFAULT_OFFERS);
    return DEFAULT_OFFERS;
  }

  return normalized;
}

export function saveAdminOffers(offers: AdminOffer[]) {
  writeStorage(STORAGE_KEYS.offers, sanitizeOffers(offers));
}

export function getAdminProductById(productId: string): AdminProduct | null {
  return getAdminProducts().find((product) => product.id === productId) ?? null;
}

export function getAdminOrders(): AdminOrder[] {
  const orders = readStorage<AdminOrder[]>(STORAGE_KEYS.orders, []);
  if (!Array.isArray(orders)) {
    return [];
  }

  return orders
    .map((order) => ({
      ...order,
      paymentStatus: order.paymentStatus || "pending_transfer",
      paymentMethodId: order.paymentMethodId || "manual-transfer",
      paymentMethodLabel: order.paymentMethodLabel || "تحويل يدوي",
      paymentReference: order.paymentReference || "",
      payerName: order.payerName || order.customerName,
      paymentReceiptImage: order.paymentReceiptImage,
    }))
    .sort((a, b) => Number(new Date(b.createdAt)) - Number(new Date(a.createdAt)));
}

export function getAdminLeads(): AdminLead[] {
  const leads = readStorage<AdminLead[]>(STORAGE_KEYS.leads, []);
  if (!Array.isArray(leads)) {
    return [];
  }

  return leads
    .map((lead) => ({
      ...lead,
      status: lead.status || "new",
      channel: lead.channel || "form",
      priority: lead.priority || "medium",
      ticketNumber: lead.ticketNumber || `TKT-${lead.id.replace("LEAD-", "")}`,
    }))
    .sort((a, b) => Number(new Date(b.createdAt)) - Number(new Date(a.createdAt)));
}

export function getAdminAuditLogs(): AdminAuditLog[] {
  const logs = readStorage<AdminAuditLog[]>(STORAGE_KEYS.audit, []);
  if (!Array.isArray(logs)) {
    return [];
  }
  return logs.sort((a, b) => Number(new Date(b.createdAt)) - Number(new Date(a.createdAt)));
}

export function addAdminAuditLog(entry: Omit<AdminAuditLog, "id" | "createdAt">) {
  const logs = getAdminAuditLogs();
  const next: AdminAuditLog = {
    ...entry,
    id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    createdAt: new Date().toISOString(),
  };
  writeStorage(STORAGE_KEYS.audit, [next, ...logs].slice(0, 500));
  return next;
}

export function getDashboardSettings(): DashboardSettings {
  const settings = readStorage<DashboardSettings | null>(STORAGE_KEYS.settings, null);
  if (!settings) {
    writeStorage(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  }

  const currencyCode = sanitizeCurrencyCode(settings.currencyCode);

  return {
    whatsappNumber: settings.whatsappNumber || DEFAULT_SETTINGS.whatsappNumber,
    supportEmail: String(settings.supportEmail || DEFAULT_SETTINGS.supportEmail).trim() || DEFAULT_SETTINGS.supportEmail,
    brandLogoPath: sanitizeBrandLogoPath(settings.brandLogoPath),
    footerContactTitle: String(settings.footerContactTitle || DEFAULT_SETTINGS.footerContactTitle).trim() || DEFAULT_SETTINGS.footerContactTitle,
    workingHoursLabel: String(settings.workingHoursLabel || DEFAULT_SETTINGS.workingHoursLabel).trim() || DEFAULT_SETTINGS.workingHoursLabel,
    currencyCode,
    currencySymbol: sanitizeCurrencySymbol(settings.currencySymbol, currencyCode),
    lowStockThreshold: Number.isFinite(settings.lowStockThreshold)
      ? Math.max(1, Number(settings.lowStockThreshold))
      : DEFAULT_SETTINGS.lowStockThreshold,
    smartMode: Boolean(settings.smartMode),
    adminPin: settings.adminPin || DEFAULT_SETTINGS.adminPin,
    walletName: String(settings.walletName || DEFAULT_SETTINGS.walletName).trim() || DEFAULT_SETTINGS.walletName,
    walletAccountNumber: String(settings.walletAccountNumber || DEFAULT_SETTINGS.walletAccountNumber).trim() || DEFAULT_SETTINGS.walletAccountNumber,
    paymentMethods: sanitizePaymentMethods(settings.paymentMethods),
    adminUsers: sanitizeAdminUsers(settings.adminUsers),
  };
}

export function saveDashboardSettings(settings: DashboardSettings) {
  const previousSettings = getDashboardSettings();
  const currencyCode = sanitizeCurrencyCode(settings.currencyCode);
  const fallbackPaymentMethods = sanitizePaymentMethods(settings.paymentMethods);
  const walletName = String(settings.walletName || "").trim() || DEFAULT_SETTINGS.walletName;
  const walletAccountNumber = String(settings.walletAccountNumber || "").trim() || DEFAULT_SETTINGS.walletAccountNumber;
  const walletMethodIndex = fallbackPaymentMethods.findIndex((method) => method.id === "wallet-default");
  const walletMethod: AdminPaymentMethod = {
    id: "wallet-default",
    name: walletName,
    provider: "تحويل محفظة",
    accountName: "متجر سر الجمال",
    accountNumber: walletAccountNumber,
    instructions: "حوّلي المبلغ ثم أضيفي مرجع العملية واسم المحوّل لإتمام الطلب.",
    isEnabled: true,
  };

  const paymentMethods =
    walletMethodIndex >= 0
      ? fallbackPaymentMethods.map((method, index) => (index === walletMethodIndex ? { ...method, ...walletMethod } : method))
      : [walletMethod, ...fallbackPaymentMethods].slice(0, 10);

  const normalized = {
    whatsappNumber: normalizeToEnglishDigits(settings.whatsappNumber).replace(/\D/g, "") || DEFAULT_SETTINGS.whatsappNumber,
    supportEmail: String(settings.supportEmail || DEFAULT_SETTINGS.supportEmail).trim() || DEFAULT_SETTINGS.supportEmail,
    brandLogoPath: sanitizeBrandLogoPath(settings.brandLogoPath),
    footerContactTitle: String(settings.footerContactTitle || DEFAULT_SETTINGS.footerContactTitle).trim() || DEFAULT_SETTINGS.footerContactTitle,
    workingHoursLabel: String(settings.workingHoursLabel || DEFAULT_SETTINGS.workingHoursLabel).trim() || DEFAULT_SETTINGS.workingHoursLabel,
    currencyCode,
    currencySymbol: sanitizeCurrencySymbol(settings.currencySymbol, currencyCode),
    lowStockThreshold: Math.max(1, Number(settings.lowStockThreshold) || DEFAULT_SETTINGS.lowStockThreshold),
    smartMode: Boolean(settings.smartMode),
    adminPin: String(settings.adminPin || "").trim() || previousSettings.adminPin || DEFAULT_SETTINGS.adminPin,
    walletName,
    walletAccountNumber,
    paymentMethods,
    adminUsers: sanitizeAdminUsers(settings.adminUsers),
  };
  writeStorage(STORAGE_KEYS.settings, normalized);
}

export function addAdminOrder(
  payload: Omit<AdminOrder, "id" | "createdAt" | "status" | "paymentStatus"> & { status?: AdminOrderStatus; paymentStatus?: AdminOrderPaymentStatus },
) {
  const orders = getAdminOrders();
  const order: AdminOrder = {
    ...payload,
    id: `ORD-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`,
    createdAt: new Date().toISOString(),
    status: payload.status ?? "new",
    paymentStatus: payload.paymentStatus ?? "pending_transfer",
  };

  writeStorage(STORAGE_KEYS.orders, [order, ...orders]);

  const products = getAdminProducts();
  const productMap = new Map(products.map((product) => [product.id, product]));
  order.items.forEach((item) => {
    const product = productMap.get(item.productId);
    if (!product) {
      return;
    }
    product.sales += item.quantity;
    product.stock = Math.max(0, product.stock - item.quantity);
    product.updatedAt = new Date().toISOString();
  });
  saveAdminProducts(Array.from(productMap.values()));

  addAdminAuditLog({
    actor: "staff",
    action: "create_order",
    entityType: "order",
    entityId: order.id,
    details: `تم إنشاء طلب جديد بقيمة ${Math.round(order.total)} ر.س عبر ${order.paymentMethodLabel}`,
  });

  return order;
}

export function updateAdminOrderStatus(orderId: string, status: AdminOrderStatus, actor: AdminRole = "staff") {
  const orders = getAdminOrders().map((order) =>
    order.id === orderId ? { ...order, status } : order,
  );
  writeStorage(STORAGE_KEYS.orders, orders);
  addAdminAuditLog({
    actor,
    action: "update_order_status",
    entityType: "order",
    entityId: orderId,
    details: `تم تحديث حالة الطلب إلى ${status}`,
  });
}

export function updateAdminOrderPaymentStatus(orderId: string, paymentStatus: AdminOrderPaymentStatus, actor: AdminRole = "staff") {
  const orders = getAdminOrders().map((order) =>
    order.id === orderId ? { ...order, paymentStatus } : order,
  );
  writeStorage(STORAGE_KEYS.orders, orders);
  addAdminAuditLog({
    actor,
    action: "update_payment_status",
    entityType: "order",
    entityId: orderId,
    details: `تم تحديث حالة الدفع إلى ${paymentStatus}`,
  });
}

export function addAdminLead(lead: Omit<AdminLead, "id" | "createdAt" | "ticketNumber" | "status"> & { status?: AdminLeadStatus }) {
  const leads = getAdminLeads();
  const createdAt = new Date().toISOString();
  const serial = Date.now().toString().slice(-6);
  const nextLead: AdminLead = {
    ...lead,
    id: `LEAD-${Date.now()}`,
    ticketNumber: `TKT-${new Date().getFullYear()}-${serial}`,
    createdAt,
    status: lead.status ?? "new",
    channel: lead.channel ?? "form",
    priority: lead.priority ?? "medium",
  };
  writeStorage(STORAGE_KEYS.leads, [nextLead, ...leads]);

  addAdminAuditLog({
    actor: "support",
    action: "create_lead",
    entityType: "lead",
    entityId: nextLead.id,
    details: `تم استقبال تذكرة جديدة ${nextLead.ticketNumber}`,
  });

  return nextLead;
}

export function updateAdminLeadStatus(leadId: string, status: AdminLeadStatus, actor: AdminRole = "support") {
  const leads = getAdminLeads().map((lead) => (lead.id === leadId ? { ...lead, status } : lead));
  writeStorage(STORAGE_KEYS.leads, leads);
  addAdminAuditLog({
    actor,
    action: "update_lead_status",
    entityType: "lead",
    entityId: leadId,
    details: `تم تحديث حالة التذكرة إلى ${status}`,
  });
}

function getTopProductName(orders: AdminOrder[]): string {
  if (orders.length === 0) {
    return "لا يوجد بيانات بعد";
  }

  const counts = new Map<string, number>();
  orders.forEach((order) => {
    order.items.forEach((item) => {
      counts.set(item.productId, (counts.get(item.productId) || 0) + item.quantity);
    });
  });

  const topEntry = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (!topEntry) {
    return "لا يوجد بيانات بعد";
  }

  return getAdminProductById(topEntry[0])?.name || topEntry[0];
}

export function buildDashboardInsights(
  products: AdminProduct[],
  orders: AdminOrder[],
  leads: AdminLead[],
  settings: DashboardSettings,
): DashboardInsights {
  const revenue = orders.reduce((sum, order) => sum + order.total, 0);
  const ordersCount = orders.length;
  const avgOrderValue = ordersCount > 0 ? revenue / ordersCount : 0;
  const pendingOrders = orders.filter(
    (order) => order.status === "new" || order.status === "processing",
  ).length;
  const lowStockProducts = products.filter((product) => product.stock <= settings.lowStockThreshold).length;
  const conversionRate = leads.length > 0 ? (ordersCount / leads.length) * 100 : ordersCount > 0 ? 100 : 0;
  const topProductName = getTopProductName(orders);

  const recommendations: string[] = [];
  if (lowStockProducts > 0) {
    recommendations.push(`يوجد ${lowStockProducts} منتجات بمخزون منخفض، يُفضّل إعادة تعبئتها اليوم.`);
  }
  if (pendingOrders > 5) {
    recommendations.push("الطلبات المعلّقة مرتفعة، فعّلي وضع المتابعة السريعة لفريق الشحن.");
  }
  if (ordersCount === 0) {
    recommendations.push("ابدئي بحملة عروض موجهة من صفحة العروض لتحفيز أول دفعة مبيعات.");
  }
  if (conversionRate < 35 && leads.length >= 5) {
    recommendations.push("معدل التحويل منخفض، أضيفي عرضًا فوريًا للعميلات اللواتي طلبن استشارة.");
  }
  if (recommendations.length === 0) {
    recommendations.push("الأداء ممتاز. استمري على نفس وتيرة العروض وراقبي المخزون يوميًا.");
  }

  return {
    revenue,
    ordersCount,
    avgOrderValue,
    pendingOrders,
    lowStockProducts,
    conversionRate,
    topProductName,
    recommendations,
  };
}

export function clearAdminData() {
  if (!hasWindow()) {
    return;
  }
  window.localStorage.removeItem(STORAGE_KEYS.orders);
  window.localStorage.removeItem(STORAGE_KEYS.leads);
  window.localStorage.removeItem(STORAGE_KEYS.audit);
}

export function getAdminStateSnapshot(): AdminStateSnapshot {
  return {
    products: getAdminProducts(),
    offers: getAdminOffers(),
    orders: getAdminOrders(),
    leads: getAdminLeads(),
    settings: getDashboardSettings(),
    auditLogs: getAdminAuditLogs(),
  };
}

export function applyAdminStateSnapshot(snapshot: Partial<AdminStateSnapshot>) {
  if (!hasWindow()) {
    return;
  }

  if (snapshot.products) {
    saveAdminProducts(snapshot.products);
  }
  if (snapshot.offers) {
    saveAdminOffers(snapshot.offers);
  }
  if (snapshot.orders) {
    writeStorage(STORAGE_KEYS.orders, sanitizeSnapshotList<AdminOrder>(snapshot.orders));
  }
  if (snapshot.leads) {
    writeStorage(STORAGE_KEYS.leads, sanitizeSnapshotList<AdminLead>(snapshot.leads));
  }
  if (snapshot.settings) {
    saveDashboardSettings(snapshot.settings);
  }
  if (snapshot.auditLogs) {
    writeStorage(STORAGE_KEYS.audit, sanitizeSnapshotList<AdminAuditLog>(snapshot.auditLogs));
  }
}

export function exportAdminReportCsv() {
  const orders = getAdminOrders();
  const leads = getAdminLeads();
  const products = getAdminProducts();
  const offers = getAdminOffers();

  const lines = [
    toCsvRow(["section", "id", "date", "name", "status", "total", "details"]),
    ...orders.map((order) =>
      toCsvRow([
        "order",
        order.id,
        order.createdAt,
        order.customerName,
        order.status,
        order.total,
        `items:${order.items.length}`,
      ]),
    ),
    ...leads.map((lead) =>
      toCsvRow([
        "lead",
        lead.ticketNumber,
        lead.createdAt,
        lead.name,
        lead.status,
        "",
        lead.selectedProductName || "",
      ]),
    ),
    ...products.map((product) =>
      toCsvRow([
        "product",
        product.sku,
        product.updatedAt,
        product.name,
        product.isActive ? "active" : "inactive",
        product.price,
        `stock:${product.stock}`,
      ]),
    ),
    ...offers.map((offer) =>
      toCsvRow([
        "offer",
        offer.id,
        offer.expiresAt,
        offer.title,
        offer.isEnabled ? "active" : "inactive",
        offer.discountPercent || offer.discountFixed || "",
        offer.couponCode || offer.href,
      ]),
    ),
  ];

  return lines.join("\n");
}
