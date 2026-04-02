"use client";

import { PRODUCTS, getProductById, type Product } from "@/data/products";

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
export type AdminLeadStatus = "new" | "contacted" | "qualified" | "closed";
export type AdminRole = "owner" | "staff" | "support";

export type AdminOrder = {
  id: string;
  createdAt: string;
  customerName: string;
  phone: string;
  city: string;
  notes: string;
  source: "checkout" | "support";
  status: AdminOrderStatus;
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
  lowStockThreshold: number;
  smartMode: boolean;
  adminPin: string;
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
  orders: AdminOrder[];
  leads: AdminLead[];
  settings: DashboardSettings;
  auditLogs: AdminAuditLog[];
};

const STORAGE_KEYS = {
  products: "sir-aljamal-admin-products",
  orders: "sir-aljamal-admin-orders",
  leads: "sir-aljamal-admin-leads",
  settings: "sir-aljamal-admin-settings",
  audit: "sir-aljamal-admin-audit",
} as const;

const DEFAULT_SETTINGS: DashboardSettings = {
  whatsappNumber: "966500000000",
  lowStockThreshold: 8,
  smartMode: true,
  adminPin: "1234",
};

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

function sanitizeProducts(products: AdminProduct[]): AdminProduct[] {
  const fallbackMap = new Map(defaultProducts().map((item) => [item.id, item]));

  return products
    .map((product) => {
      const fallback = fallbackMap.get(product.id);
      if (!fallback) {
        return null;
      }

      return {
        ...fallback,
        ...product,
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

export function getAdminOrders(): AdminOrder[] {
  const orders = readStorage<AdminOrder[]>(STORAGE_KEYS.orders, []);
  if (!Array.isArray(orders)) {
    return [];
  }

  return orders.sort((a, b) => Number(new Date(b.createdAt)) - Number(new Date(a.createdAt)));
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

  return {
    whatsappNumber: settings.whatsappNumber || DEFAULT_SETTINGS.whatsappNumber,
    lowStockThreshold: Number.isFinite(settings.lowStockThreshold)
      ? Math.max(1, Number(settings.lowStockThreshold))
      : DEFAULT_SETTINGS.lowStockThreshold,
    smartMode: Boolean(settings.smartMode),
    adminPin: settings.adminPin || DEFAULT_SETTINGS.adminPin,
  };
}

export function saveDashboardSettings(settings: DashboardSettings) {
  const normalized = {
    whatsappNumber: settings.whatsappNumber.replace(/\D/g, "") || DEFAULT_SETTINGS.whatsappNumber,
    lowStockThreshold: Math.max(1, Number(settings.lowStockThreshold) || DEFAULT_SETTINGS.lowStockThreshold),
    smartMode: Boolean(settings.smartMode),
    adminPin: settings.adminPin.trim() || DEFAULT_SETTINGS.adminPin,
  };
  writeStorage(STORAGE_KEYS.settings, normalized);
}

export function addAdminOrder(
  payload: Omit<AdminOrder, "id" | "createdAt" | "status"> & { status?: AdminOrderStatus },
) {
  const orders = getAdminOrders();
  const order: AdminOrder = {
    ...payload,
    id: `ORD-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`,
    createdAt: new Date().toISOString(),
    status: payload.status ?? "new",
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
    details: `تم إنشاء طلب جديد بقيمة ${Math.round(order.total)} ر.س`,
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

  return getProductById(topEntry[0])?.name || topEntry[0];
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
  if (snapshot.orders) {
    writeStorage(STORAGE_KEYS.orders, snapshot.orders);
  }
  if (snapshot.leads) {
    writeStorage(STORAGE_KEYS.leads, snapshot.leads);
  }
  if (snapshot.settings) {
    saveDashboardSettings(snapshot.settings);
  }
  if (snapshot.auditLogs) {
    writeStorage(STORAGE_KEYS.audit, snapshot.auditLogs);
  }
}

export function exportAdminReportCsv() {
  const orders = getAdminOrders();
  const leads = getAdminLeads();
  const products = getAdminProducts();

  const lines = [
    ["section", "id", "date", "name", "status", "total", "details"].join(","),
    ...orders.map((order) =>
      [
        "order",
        order.id,
        order.createdAt,
        order.customerName,
        order.status,
        order.total,
        `items:${order.items.length}`,
      ].join(","),
    ),
    ...leads.map((lead) =>
      [
        "lead",
        lead.ticketNumber,
        lead.createdAt,
        lead.name,
        lead.status,
        "",
        lead.selectedProductName || "",
      ].join(","),
    ),
    ...products.map((product) =>
      [
        "product",
        product.sku,
        product.updatedAt,
        product.name,
        product.isActive ? "active" : "inactive",
        product.price,
        `stock:${product.stock}`,
      ].join(","),
    ),
  ];

  return lines.join("\n");
}
