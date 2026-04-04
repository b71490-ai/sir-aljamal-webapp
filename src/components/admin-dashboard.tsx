"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, type ChangeEvent, type DragEvent } from "react";
import { CATEGORY_LABELS, type ProductCategory } from "@/data/products";
import {
  getAdminOffers,
  addAdminAuditLog,
  applyAdminStateSnapshot,
  buildDashboardInsights,
  clearAdminData,
  exportAdminReportCsv,
  getAdminAuditLogs,
  getAdminLeads,
  getAdminOrders,
  getAdminProducts,
  getAdminStateSnapshot,
  getDashboardSettings,
  saveAdminOffers,
  saveAdminProducts,
  saveDashboardSettings,
  updateAdminOrderPaymentStatus,
  updateAdminLeadStatus,
  updateAdminOrderStatus,
  type AdminOrderPaymentStatus,
  type AdminPaymentMethod,
  type AdminOffer,
  type AdminProduct,
  type AdminLeadStatus,
  type AdminRole,
  type AdminOrderStatus,
  type DashboardSettings,
} from "@/lib/admin-storage";
import { pullAdminStateFromServer, pushAdminStateToServer } from "@/lib/admin-sync";
import { formatArabicDateWithEnglishDigits, normalizeToEnglishDigits } from "@/lib/digits";

const TABS = [
  { id: "overview", label: "نظرة عامة" },
  { id: "products", label: "إدارة المنتجات" },
  { id: "offers", label: "إدارة العروض" },
  { id: "orders", label: "الطلبات" },
  { id: "leads", label: "رسائل العملاء" },
  { id: "audit", label: "سجل التدقيق" },
  { id: "reports", label: "التقارير" },
  { id: "settings", label: "الإعدادات الذكية" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const STATUS_LABELS: Record<AdminOrderStatus, string> = {
  new: "جديد",
  processing: "قيد التجهيز",
  shipped: "تم الشحن",
  completed: "مكتمل",
  cancelled: "ملغي",
};

const PAYMENT_STATUS_LABELS: Record<AdminOrderPaymentStatus, string> = {
  pending_transfer: "بانتظار الحوالة",
  under_review: "تحت المراجعة",
  paid: "مدفوع",
  rejected: "مرفوض",
};

const LEAD_STATUS_LABELS: Record<AdminLeadStatus, string> = {
  new: "جديدة",
  contacted: "تم التواصل",
  qualified: "مؤهلة",
  closed: "مغلقة",
};

const ROLE_LABELS: Record<AdminRole, string> = {
  owner: "مالك",
  staff: "موظف",
  support: "دعم",
};

const ROLE_TABS: Record<AdminRole, TabId[]> = {
  owner: ["overview", "products", "offers", "orders", "leads", "audit", "reports", "settings"],
  staff: ["overview", "products", "offers", "orders", "reports"],
  support: ["overview", "leads", "orders", "reports"],
};

const CATEGORY_KEYS = Object.keys(CATEGORY_LABELS) as ProductCategory[];

type ProductStatusFilter = "all" | "active" | "inactive";

type AdminDashboardProps = {
  role: AdminRole;
};

function formatCurrency(value: number, symbol: string) {
  return `${Math.round(value)} ${symbol}`;
}

function formatDate(value: string) {
  return formatArabicDateWithEnglishDigits(value);
}

function parseDateTimeLocalToIso(value: string, fallbackIso: string) {
  if (!value) {
    return fallbackIso;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return fallbackIso;
  }

  return parsed.toISOString();
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPotentialSnapshot(value: unknown): value is Record<string, unknown> {
  if (!isObjectRecord(value)) {
    return false;
  }

  const maxItems = 5000;
  const listKeys = ["products", "offers", "orders", "leads", "auditLogs"] as const;
  for (const key of listKeys) {
    const current = value[key];
    if (current !== undefined) {
      if (!Array.isArray(current) || current.length > maxItems) {
        return false;
      }
    }
  }

  if (value.settings !== undefined && !isObjectRecord(value.settings)) {
    return false;
  }

  return true;
}

function makeProductId(value: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
  if (slug) {
    return `custom-${slug}-${Date.now().toString().slice(-5)}`;
  }
  return `custom-${Date.now()}`;
}

function normalizeImageInput(raw: string): string | null {
  const value = raw.trim();
  if (!value) {
    return null;
  }

  if (value.startsWith("data:image/")) {
    return value;
  }

  if (value.startsWith("/")) {
    return value;
  }

  if (value.startsWith("products/")) {
    return `/${value}`;
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return null;
}

function splitImageInputs(raw: string) {
  return raw
    .split(/\n|,/)
    .map((item) => normalizeImageInput(item))
    .filter((item): item is string => Boolean(item));
}

function normalizeDigits(value: string) {
  return normalizeToEnglishDigits(value);
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("file_read_failed"));
    reader.readAsDataURL(file);
  });
}

function loadImageElement(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("image_load_failed"));
    image.src = src;
  });
}

async function optimizeImageFile(file: File) {
  const dataUrl = await readFileAsDataUrl(file);

  if (file.type.includes("svg") || file.type.includes("gif")) {
    return dataUrl;
  }

  const image = await loadImageElement(dataUrl);
  const maxDimension = 1400;
  const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));

  const context = canvas.getContext("2d");
  if (!context) {
    return dataUrl;
  }

  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/webp", 0.82);
}

export default function AdminDashboard({ role }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [products, setProducts] = useState(() => getAdminProducts());
  const [offers, setOffers] = useState(() => getAdminOffers());
  const [orders, setOrders] = useState(() => getAdminOrders());
  const [leads, setLeads] = useState(() => getAdminLeads());
  const [auditLogs, setAuditLogs] = useState(() => getAdminAuditLogs());
  const [settings, setSettings] = useState<DashboardSettings>(() => getDashboardSettings());
  const [notice, setNotice] = useState<string>("");
  const [imageDraftByProduct, setImageDraftByProduct] = useState<Record<string, string>>({});
  const [draggingProductId, setDraggingProductId] = useState<string | null>(null);
  const [uploadingProductIds, setUploadingProductIds] = useState<Record<string, boolean>>({});
  const [productQuery, setProductQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<ProductCategory | "all">("all");
  const [statusFilter, setStatusFilter] = useState<ProductStatusFilter>("all");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [autoSaveProducts, setAutoSaveProducts] = useState(true);
  const [lastSavedProductsSignature, setLastSavedProductsSignature] = useState(() => JSON.stringify(getAdminProducts()));
  const [persistenceStatus, setPersistenceStatus] = useState("");

  const insights = useMemo(
    () => buildDashboardInsights(products, orders, leads, settings),
    [products, orders, leads, settings],
  );

  const productsSignature = useMemo(() => JSON.stringify(products), [products]);
  const hasUnsavedProducts = productsSignature !== lastSavedProductsSignature;

  const filteredProducts = useMemo(() => {
    const query = productQuery.trim().toLowerCase();

    return products.filter((product) => {
      if (categoryFilter !== "all" && product.category !== categoryFilter) {
        return false;
      }

      if (statusFilter === "active" && !product.isActive) {
        return false;
      }

      if (statusFilter === "inactive" && product.isActive) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        product.name.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query) ||
        product.badge.toLowerCase().includes(query)
      );
    });
  }, [products, productQuery, categoryFilter, statusFilter]);

  function refreshData() {
    const nextProducts = getAdminProducts();
    setProducts(nextProducts);
    setOffers(getAdminOffers());
    setOrders(getAdminOrders());
    setLeads(getAdminLeads());
    setAuditLogs(getAdminAuditLogs());
    setSettings(getDashboardSettings());
    setLastSavedProductsSignature(JSON.stringify(nextProducts));
    setSelectedProductIds([]);
  }

  const visibleTabs = ROLE_TABS[role];
  const currentTab = visibleTabs.includes(activeTab) ? activeTab : visibleTabs[0];

  useEffect(() => {
    let isMounted = true;

    const syncNow = async (silent = false) => {
      const ok = await pullAdminStateFromServer();
      if (!isMounted) {
        return;
      }
      if (ok) {
        refreshData();
        if (!silent) {
          setNotice("تمت المزامنة التلقائية مع السيرفر");
          window.setTimeout(() => setNotice(""), 1800);
        }
      }
    };

    void syncNow(true);
    const intervalId = window.setInterval(() => {
      void syncNow(true);
    }, 30000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.Notification === "undefined") {
      return;
    }

    if (Notification.permission === "default") {
      Notification.requestPermission();
      return;
    }

    if (Notification.permission === "granted" && insights.lowStockProducts > 0) {
      const body = `يوجد ${insights.lowStockProducts} منتجات بمخزون منخفض`;
      const notification = new Notification("تنبيه المخزون", { body });
      window.setTimeout(() => notification.close(), 3000);
    }
  }, [insights.lowStockProducts]);

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedProducts) {
        return;
      }
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsavedProducts]);

  useEffect(() => {
    if (!autoSaveProducts || !hasUnsavedProducts || currentTab !== "products") {
      return;
    }

    const intervalId = window.setInterval(() => {
      saveAdminProducts(products);
      setLastSavedProductsSignature(JSON.stringify(products));
      void pushAdminStateToServer();
      setNotice("تم الحفظ التلقائي لتعديلات المنتجات");
      window.setTimeout(() => setNotice(""), 1400);
    }, 25000);

    return () => window.clearInterval(intervalId);
  }, [autoSaveProducts, hasUnsavedProducts, currentTab, products]);

  useEffect(() => {
    const productIds = new Set(products.map((product) => product.id));
    setSelectedProductIds((prev) => prev.filter((id) => productIds.has(id)));
  }, [products]);

  function setSuccess(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 1800);
  }

  function addNewOffer() {
    setOffers((prev) => [
      {
        id: `offer-${Date.now()}`,
        title: "عرض جديد",
        details: "اكتبي تفاصيل العرض هنا",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        href: "/store",
        badge: "عرض خاص",
        rule: {},
        discountPercent: 15,
        isEnabled: true,
      },
      ...prev,
    ]);
    setSuccess("تمت إضافة مسودة عرض جديد");
  }

  function updateOffer(offerId: string, updater: (offer: AdminOffer) => AdminOffer) {
    setOffers((prev) => prev.map((offer) => (offer.id === offerId ? updater(offer) : offer)));
  }

  function deleteOffer(offerId: string) {
    const confirmed = window.confirm("تأكيد حذف العرض؟");
    if (!confirmed) {
      return;
    }
    setOffers((prev) => prev.filter((offer) => offer.id !== offerId));
    setSuccess("تم حذف العرض. احفظي التعديلات لتثبيته");
  }

  function saveOffers() {
    saveAdminOffers(offers);
    addAdminAuditLog({
      actor: role,
      action: "save_offers",
      entityType: "settings",
      details: "تم حفظ تعديلات العروض من لوحة الإدارة",
    });
    setOffers(getAdminOffers());
    setAuditLogs(getAdminAuditLogs());
    setSuccess("تم حفظ العروض");
    void pushAdminStateToServer();
  }

  function updateProductField(productId: string, key: "price" | "stock" | "badge" | "isActive", value: string | boolean) {
    setProducts((prev) =>
      prev.map((product) => {
        if (product.id !== productId) {
          return product;
        }

        const next = { ...product, updatedAt: new Date().toISOString() };
        if (key === "price") {
          next.price = Math.max(1, Number(value) || product.price);
        }
        if (key === "stock") {
          const parsed = Number(value);
          next.stock = Number.isFinite(parsed) ? Math.max(0, parsed) : product.stock;
        }
        if (key === "badge") {
          next.badge = String(value);
        }
        if (key === "isActive") {
          next.isActive = Boolean(value);
        }
        return next;
      }),
    );
  }

  function updateProductTextField(productId: string, key: "imagePath" | "imageAlt" | "imageGallery", value: string) {
    setProducts((prev) =>
      prev.map((product) => {
        if (product.id !== productId) {
          return product;
        }

        const next = { ...product, updatedAt: new Date().toISOString() };
        if (key === "imagePath") {
          const normalized = normalizeImageInput(value);
          if (!normalized) {
            setNotice("رابط صورة الغلاف غير صالح. استخدمي /products/... أو https://...");
            window.setTimeout(() => setNotice(""), 1800);
            return product;
          }
          next.imagePath = normalized;
          next.imageGallery = [normalized, ...product.imageGallery.filter((item) => item !== normalized)].slice(0, 12);
        }
        if (key === "imageAlt") {
          next.imageAlt = value;
        }
        if (key === "imageGallery") {
          const gallery = splitImageInputs(value).slice(0, 12);

          if (gallery.length > 0) {
            next.imageGallery = gallery;
            next.imagePath = gallery[0];
          }
        }

        return next;
      }),
    );
  }

  function updateProductMetaField(
    productId: string,
    key: "name" | "category" | "shortDescription" | "rating" | "benefits",
    value: string,
  ) {
    setProducts((prev) =>
      prev.map((product) => {
        if (product.id !== productId) {
          return product;
        }

        const next = { ...product, updatedAt: new Date().toISOString() };
        if (key === "name") {
          next.name = value;
        }
        if (key === "category") {
          const category = value as ProductCategory;
          next.category = category;
          next.categoryLabel = CATEGORY_LABELS[category];
        }
        if (key === "shortDescription") {
          next.shortDescription = value;
        }
        if (key === "rating") {
          const parsed = Number(value);
          if (Number.isFinite(parsed)) {
            next.rating = Math.max(1, Math.min(5, parsed));
          }
        }
        if (key === "benefits") {
          const benefits = value
            .split(/\n|,/)
            .map((item) => item.trim())
            .filter(Boolean)
            .slice(0, 8);
          if (benefits.length > 0) {
            next.benefits = benefits;
          }
        }

        return next;
      }),
    );
  }

  function addNewProduct() {
    const now = new Date().toISOString();
    const category: ProductCategory = "skin-care";
    const newProduct: AdminProduct = {
      id: makeProductId("new-product"),
      name: "منتج جديد",
      category,
      categoryLabel: CATEGORY_LABELS[category],
      imagePath: "/products/vitamin-c-serum.svg",
      imageGallery: ["/products/vitamin-c-serum.svg"],
      imageAlt: "صورة منتج جديد",
      price: 99,
      badge: "جديد",
      rating: 4.5,
      shortDescription: "أضيفي وصف المنتج هنا",
      benefits: ["ميزة أساسية"],
      sku: `SJ-C-${Date.now().toString().slice(-5)}`,
      stock: 10,
      isActive: true,
      sales: 0,
      updatedAt: now,
    };

    setProducts((prev) => [newProduct, ...prev]);
    setSuccess("تم إضافة منتج جديد، عدلي البيانات ثم اضغطي حفظ التعديلات");
  }

  function deleteProduct(productId: string) {
    const target = products.find((item) => item.id === productId);
    if (!target) {
      return;
    }

    const confirmed = window.confirm(`هل تريدين حذف المنتج: ${target.name}؟`);
    if (!confirmed) {
      return;
    }

    setProducts((prev) => prev.filter((item) => item.id !== productId));
    setSuccess("تم حذف المنتج من القائمة الحالية، اضغطي حفظ التعديلات للتثبيت");
  }

  function addImageByPaste(productId: string) {
    const draft = String(imageDraftByProduct[productId] || "").trim();
    if (!draft) {
      return;
    }

    const normalized = splitImageInputs(draft);
    if (normalized.length === 0) {
      setNotice("الرابط غير صالح. استخدمي /products/... أو https://...");
      window.setTimeout(() => setNotice(""), 1800);
      return;
    }

    setProducts((prev) =>
      prev.map((product) => {
        if (product.id !== productId) {
          return product;
        }

        const gallery = [
          ...product.imageGallery,
          ...normalized,
        ]
          .filter((item, index, arr) => arr.indexOf(item) === index)
          .slice(0, 12);

        return {
          ...product,
          imageGallery: gallery,
          imagePath: gallery[0] || product.imagePath,
          updatedAt: new Date().toISOString(),
        };
      }),
    );

    setImageDraftByProduct((prev) => ({ ...prev, [productId]: "" }));
  }

  function removeGalleryImage(productId: string, imagePath: string) {
    setProducts((prev) =>
      prev.map((product) => {
        if (product.id !== productId) {
          return product;
        }

        const gallery = product.imageGallery.filter((item) => item !== imagePath);
        if (gallery.length === 0) {
          return product;
        }

        return {
          ...product,
          imageGallery: gallery,
          imagePath: gallery[0],
          updatedAt: new Date().toISOString(),
        };
      }),
    );
  }

  function setGalleryCover(productId: string, imagePath: string) {
    setProducts((prev) =>
      prev.map((product) => {
        if (product.id !== productId) {
          return product;
        }

        if (!product.imageGallery.includes(imagePath)) {
          return product;
        }

        return {
          ...product,
          imagePath,
          imageGallery: [imagePath, ...product.imageGallery.filter((item) => item !== imagePath)].slice(0, 12),
          updatedAt: new Date().toISOString(),
        };
      }),
    );
  }

  function appendImagesToProduct(productId: string, incomingImages: string[]) {
    if (incomingImages.length === 0) {
      return;
    }

    setProducts((prev) =>
      prev.map((product) => {
        if (product.id !== productId) {
          return product;
        }

        const gallery = [...product.imageGallery, ...incomingImages]
          .map((item) => normalizeImageInput(item) || "")
          .filter(Boolean)
          .filter((item, index, arr) => arr.indexOf(item) === index)
          .slice(0, 12);

        return {
          ...product,
          imageGallery: gallery,
          imagePath: gallery[0] || product.imagePath,
          updatedAt: new Date().toISOString(),
        };
      }),
    );
  }

  async function handleImageFiles(productId: string, files: FileList | File[]) {
    const list = Array.from(files).filter((file) => file.type.startsWith("image/"));
    if (list.length === 0) {
      return;
    }

    setUploadingProductIds((prev) => ({ ...prev, [productId]: true }));

    try {
      const preparedImages = await Promise.all(list.map((file) => optimizeImageFile(file)));
      appendImagesToProduct(productId, preparedImages);
      setSuccess(`تمت إضافة ${preparedImages.length} صورة للمنتج`);
    } catch {
      setNotice("تعذر تجهيز الصور المرفوعة. جربي صورًا أصغر أو بصيغة مختلفة.");
      window.setTimeout(() => setNotice(""), 2200);
    } finally {
      setUploadingProductIds((prev) => ({ ...prev, [productId]: false }));
      setDraggingProductId((current) => (current === productId ? null : current));
    }
  }

  async function handleImageInputChange(productId: string, event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) {
      await handleImageFiles(productId, event.target.files);
      event.target.value = "";
    }
  }

  async function handleLogoFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || !file.type.startsWith("image/")) {
      return;
    }

    try {
      const formData = new FormData();
      formData.append("logo", file);

      const response = await fetch("/api/admin/logo-upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        setNotice("تعذر رفع الشعار. تأكدي من تسجيل الدخول كمسؤولة.");
        window.setTimeout(() => setNotice(""), 1800);
        return;
      }

      const payload = (await response.json()) as { ok?: boolean; path?: string };
      const logoPath = String(payload.path || "").trim();
      if (!payload.ok || !logoPath.startsWith("/")) {
        setNotice("تعذر حفظ الشعار المرفوع.");
        window.setTimeout(() => setNotice(""), 1800);
        return;
      }

      setSettings((prev) => ({
        ...prev,
        brandLogoPath: logoPath,
      }));
      setSuccess("تم اختيار الشعار من الملفات");
    } catch {
      setNotice("تعذر قراءة ملف الشعار. جربي صورة بصيغة أخرى.");
      window.setTimeout(() => setNotice(""), 1800);
    }
  }

  function handleImageDrop(productId: string, event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDraggingProductId(null);
    void handleImageFiles(productId, event.dataTransfer.files);
  }

  function saveProducts() {
    saveAdminProducts(products);
    setProducts(getAdminProducts());
    setLastSavedProductsSignature(JSON.stringify(products));
    setSelectedProductIds([]);
    addAdminAuditLog({
      actor: role,
      action: "save_products",
      entityType: "product",
      details: "تم حفظ تعديلات المنتجات من لوحة الإدارة",
    });
    setSuccess("تم حفظ تعديلات المنتجات");
    void pushAdminStateToServer();
  }

  function toggleProductSelection(productId: string, checked: boolean) {
    setSelectedProductIds((prev) =>
      checked ? [...new Set([...prev, productId])] : prev.filter((id) => id !== productId),
    );
  }

  function toggleSelectAllFiltered(checked: boolean) {
    if (!checked) {
      setSelectedProductIds([]);
      return;
    }
    setSelectedProductIds(filteredProducts.map((item) => item.id));
  }

  function applyBulkStatus(isActive: boolean) {
    if (selectedProductIds.length === 0) {
      return;
    }

    const targetIds = new Set(selectedProductIds);
    setProducts((prev) =>
      prev.map((product) =>
        targetIds.has(product.id)
          ? { ...product, isActive, updatedAt: new Date().toISOString() }
          : product,
      ),
    );
    setSuccess(isActive ? "تم تفعيل المنتجات المحددة" : "تم إخفاء المنتجات المحددة");
  }

  function deleteSelectedProducts() {
    if (selectedProductIds.length === 0) {
      return;
    }

    const confirmed = window.confirm(`تأكيد حذف ${selectedProductIds.length} منتج؟`);
    if (!confirmed) {
      return;
    }

    const targetIds = new Set(selectedProductIds);
    setProducts((prev) => prev.filter((product) => !targetIds.has(product.id)));
    setSelectedProductIds([]);
    setSuccess("تم حذف المنتجات المحددة. اضغطي حفظ التعديلات للتثبيت");
  }

  function handleStatusChange(orderId: string, status: AdminOrderStatus) {
    updateAdminOrderStatus(orderId, status, role);
    setOrders(getAdminOrders());
    setAuditLogs(getAdminAuditLogs());
    setSuccess("تم تحديث حالة الطلب");
    void pushAdminStateToServer();
  }

  function handleLeadStatusChange(leadId: string, status: AdminLeadStatus) {
    updateAdminLeadStatus(leadId, status, role);
    setLeads(getAdminLeads());
    setAuditLogs(getAdminAuditLogs());
    setSuccess("تم تحديث حالة التذكرة");
    void pushAdminStateToServer();
  }

  function handlePaymentStatusChange(orderId: string, paymentStatus: AdminOrderPaymentStatus) {
    updateAdminOrderPaymentStatus(orderId, paymentStatus, role);
    setOrders(getAdminOrders());
    setAuditLogs(getAdminAuditLogs());
    setSuccess("تم تحديث حالة الدفع");
    void pushAdminStateToServer();
  }

  function addPaymentMethod() {
    setSettings((prev) => ({
      ...prev,
      paymentMethods: [
        ...prev.paymentMethods,
        {
          id: `payment-${Date.now()}`,
          name: "وسيلة جديدة",
          provider: "تحويل يدوي",
          accountName: "",
          accountNumber: "",
          instructions: "",
          isEnabled: true,
        },
      ],
    }));
  }

  function updatePaymentMethod(methodId: string, updater: (method: AdminPaymentMethod) => AdminPaymentMethod) {
    setSettings((prev) => ({
      ...prev,
      paymentMethods: prev.paymentMethods.map((method) => (method.id === methodId ? updater(method) : method)),
    }));
  }

  function removePaymentMethod(methodId: string) {
    setSettings((prev) => ({
      ...prev,
      paymentMethods: prev.paymentMethods.filter((method) => method.id !== methodId),
    }));
  }

  async function handleSaveSettings() {
    saveDashboardSettings(settings);
    window.dispatchEvent(new Event("sir-admin-settings-updated"));
    addAdminAuditLog({
      actor: role,
      action: "save_settings",
      entityType: "settings",
      details: "تم تحديث إعدادات النظام",
    });
    setSettings(getDashboardSettings());
    setAuditLogs(getAdminAuditLogs());
    const ok = await pushAdminStateToServer();
    setSuccess(ok ? "تم حفظ الإعدادات" : "تم الحفظ محليًا لكن تعذر مزامنة الإعدادات مع السيرفر");
  }

  function handleSmartReset() {
    clearAdminData();
    addAdminAuditLog({
      actor: role,
      action: "clear_data",
      entityType: "system",
      details: "تم مسح الطلبات والرسائل من النظام",
    });
    refreshData();
    setSuccess("تم تنظيف الطلبات والرسائل بنجاح");
    void pushAdminStateToServer();
  }

  function handleExportReports() {
    const csv = exportAdminReportCsv();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `sir-aljamal-report-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    addAdminAuditLog({
      actor: role,
      action: "export_report",
      entityType: "system",
      details: "تم تصدير تقرير CSV",
    });
    setAuditLogs(getAdminAuditLogs());
    setSuccess("تم تصدير التقرير بنجاح");
  }

  function handleExportBackup() {
    const payload = JSON.stringify(getAdminStateSnapshot(), null, 2);
    const blob = new Blob([payload], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `sir-aljamal-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    addAdminAuditLog({
      actor: role,
      action: "export_backup",
      entityType: "system",
      details: "تم تصدير نسخة احتياطية JSON",
    });
    setAuditLogs(getAdminAuditLogs());
    setSuccess("تم تنزيل النسخة الاحتياطية.");
  }

  async function handleImportBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    try {
      const raw = await file.text();
      const parsed = JSON.parse(raw);

      if (!isPotentialSnapshot(parsed)) {
        setNotice("ملف النسخة الاحتياطية غير صالح أو حجمه كبير جدًا.");
        window.setTimeout(() => setNotice(""), 1800);
        return;
      }

      applyAdminStateSnapshot(parsed);
      refreshData();
      addAdminAuditLog({
        actor: role,
        action: "import_backup",
        entityType: "system",
        details: "تم استيراد نسخة احتياطية JSON",
      });
      setAuditLogs(getAdminAuditLogs());
      setSuccess("تم استيراد النسخة الاحتياطية.");
      void pushAdminStateToServer();
    } catch {
      setSuccess("ملف النسخة الاحتياطية غير صالح.");
    }
  }

  async function handlePullFromServer() {
    const ok = await pullAdminStateFromServer();
    refreshData();
    setSuccess(ok ? "تم جلب أحدث البيانات من السيرفر" : "تعذر جلب البيانات من السيرفر");
  }

  async function handlePushToServer() {
    const ok = await pushAdminStateToServer();
    setSuccess(ok ? "تم رفع البيانات الحالية إلى السيرفر" : "تعذر رفع البيانات إلى السيرفر");
  }

  async function handleCheckPersistence() {
    try {
      const response = await fetch("/api/admin/health", { method: "GET", cache: "no-store" });
      if (!response.ok) {
        setPersistenceStatus("تعذر فحص حالة التخزين حاليًا.");
        return;
      }

      const payload = (await response.json()) as {
        ok?: boolean;
        persistence?: { mode: "supabase" | "file"; supabaseConfigured: boolean; supabaseReady: boolean };
      };

      if (!payload.ok || !payload.persistence) {
        setPersistenceStatus("تعذر قراءة حالة التخزين.");
        return;
      }

      if (payload.persistence.mode === "supabase") {
        setPersistenceStatus("حالة التخزين: Supabase متصل ويعمل.");
        return;
      }

      if (payload.persistence.supabaseConfigured && !payload.persistence.supabaseReady) {
        setPersistenceStatus("حالة التخزين: Supabase مُعرّف لكن غير جاهز، جاري استخدام ملف محلي.");
        return;
      }

      setPersistenceStatus("حالة التخزين: ملف محلي (JSON).");
    } catch {
      setPersistenceStatus("تعذر فحص حالة التخزين حاليًا.");
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/admin/auth", { method: "DELETE" });
      window.location.reload();
    } catch {
      setNotice("تعذر تسجيل الخروج الآن");
      window.setTimeout(() => setNotice(""), 1400);
    }
  }

  return (
    <main className="admin-root site-shell" dir="rtl">
      <section className="admin-hero">
        <div>
          <p className="inner-page__kicker">لوحة التحكم الذكية</p>
          <h1 className="inner-page__title">إدارة منصة سر الجمال</h1>
          <p className="inner-page__desc">
            لوحة متكاملة لإدارة المنتجات والطلبات ورسائل العملاء مع مؤشرات ذكية لحظية.
          </p>
        </div>
        <div className="admin-hero__chips">
          <span>إدارة كاملة</span>
          <span>تحليلات ذكية</span>
          <span>قرارات أسرع</span>
        </div>
      </section>

      <section className="mb-3 flex flex-wrap items-center gap-2 rounded-2xl border border-zinc-200 bg-white p-3">
        <p className="text-sm font-black text-zinc-800">الدور الحالي:</p>
        <span className="hero-btn hero-btn--primary">{ROLE_LABELS[role]}</span>
        <button className="hero-btn hero-btn--secondary" type="button" onClick={handlePullFromServer}>
          مزامنة من السيرفر
        </button>
        <button className="hero-btn hero-btn--secondary" type="button" onClick={handlePushToServer}>
          رفع إلى السيرفر
        </button>
        <button className="hero-btn hero-btn--secondary" type="button" onClick={() => void handleCheckPersistence()}>
          فحص التخزين
        </button>
        <button className="hero-btn hero-btn--secondary" type="button" onClick={() => void handleLogout()}>
          تسجيل الخروج
        </button>
      </section>

      {persistenceStatus ? (
        <section className="mb-3 rounded-2xl border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-black text-zinc-800">
          {persistenceStatus}
        </section>
      ) : null}

      <section className="admin-tabs" aria-label="تبويبات الإدارة">
        {TABS.filter((tab) => visibleTabs.includes(tab.id)).map((tab) => (
          <button
            key={tab.id}
            className={`admin-tabs__btn ${currentTab === tab.id ? "is-active" : ""}`}
            type="button"
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </section>

      {notice ? <p className="admin-notice">{notice}</p> : null}

      {currentTab === "overview" ? (
        <section className="admin-panel-grid">
          <article className="admin-metric">
            <p className="admin-metric__label">إجمالي المبيعات</p>
            <p className="admin-metric__value">{formatCurrency(insights.revenue, settings.currencySymbol)}</p>
          </article>
          <article className="admin-metric">
            <p className="admin-metric__label">عدد الطلبات</p>
            <p className="admin-metric__value">{insights.ordersCount}</p>
          </article>
          <article className="admin-metric">
            <p className="admin-metric__label">متوسط الطلب</p>
            <p className="admin-metric__value">{formatCurrency(insights.avgOrderValue, settings.currencySymbol)}</p>
          </article>
          <article className="admin-metric">
            <p className="admin-metric__label">طلبات قيد المتابعة</p>
            <p className="admin-metric__value">{insights.pendingOrders}</p>
          </article>
          <article className="admin-metric">
            <p className="admin-metric__label">منتجات منخفضة المخزون</p>
            <p className="admin-metric__value">{insights.lowStockProducts}</p>
          </article>
          <article className="admin-metric">
            <p className="admin-metric__label">معدل التحويل</p>
            <p className="admin-metric__value">{insights.conversionRate.toFixed(1)}%</p>
          </article>

          <article className="admin-card admin-card--wide">
            <h2>أهم منتج أداءً</h2>
            <p className="admin-highlight">{insights.topProductName}</p>
            <p className="admin-muted">يعتمد على أعلى كمية مبيعات مسجلة من الطلبات الفعلية.</p>
          </article>

          <article className="admin-card admin-card--wide">
            <h2>اقتراحات ذكية اليوم</h2>
            <ul className="admin-list">
              {insights.recommendations.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </section>
      ) : null}

      {currentTab === "products" ? (
        <section className="admin-card admin-products-shell">
          <div className="admin-products-toolbar">
            <div>
              <h2>إدارة المنتجات</h2>
              <p className="admin-muted">واجهة تحرير أنظف للصور والأسعار والمخزون مع معاينة مرئية لكل منتج.</p>
            </div>
            <div className="admin-inline-actions">
              <button className="hero-btn hero-btn--secondary" type="button" onClick={addNewProduct}>
                إضافة منتج
              </button>
              <button className="hero-btn hero-btn--primary" type="button" onClick={saveProducts}>
                حفظ التعديلات
              </button>
            </div>
          </div>

          <div className="admin-filters">
            <input
              className="form-input"
              type="search"
              placeholder="بحث بالاسم أو SKU أو الشارة"
              value={productQuery}
              onChange={(event) => setProductQuery(event.target.value)}
            />
            <select
              className="form-input"
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value as ProductCategory | "all")}
            >
              <option value="all">كل الأقسام</option>
              {CATEGORY_KEYS.map((categoryKey) => (
                <option key={categoryKey} value={categoryKey}>
                  {CATEGORY_LABELS[categoryKey]}
                </option>
              ))}
            </select>
            <select
              className="form-input"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as ProductStatusFilter)}
            >
              <option value="all">كل الحالات</option>
              <option value="active">نشط</option>
              <option value="inactive">مخفي</option>
            </select>
          </div>

          <div className="admin-inline-actions">
            <label className="admin-switch admin-switch--block">
              <input
                type="checkbox"
                checked={autoSaveProducts}
                onChange={(event) => setAutoSaveProducts(event.target.checked)}
              />
              <span>حفظ تلقائي للمنتجات</span>
            </label>
            <label className="admin-switch admin-switch--block">
              <input
                type="checkbox"
                checked={selectedProductIds.length > 0 && selectedProductIds.length === filteredProducts.length && filteredProducts.length > 0}
                onChange={(event) => toggleSelectAllFiltered(event.target.checked)}
              />
              <span>تحديد كل النتائج ({filteredProducts.length})</span>
            </label>
            <button className="hero-btn hero-btn--secondary" type="button" onClick={() => applyBulkStatus(true)}>
              تفعيل المحدد
            </button>
            <button className="hero-btn hero-btn--secondary" type="button" onClick={() => applyBulkStatus(false)}>
              إخفاء المحدد
            </button>
            <button className="hero-btn hero-btn--secondary" type="button" onClick={deleteSelectedProducts}>
              حذف المحدد
            </button>
            {hasUnsavedProducts ? <p className="admin-muted">يوجد تعديلات غير محفوظة</p> : null}
          </div>

          <div className="admin-products-grid">
            {filteredProducts.map((product) => {
              const primaryImage = product.imageGallery[0] || product.imagePath;

              return (
                <article key={product.id} className="admin-product-card">
                  <div className="admin-product-card__top">
                    <div className="admin-product-card__hero">
                      <div className="admin-product-card__image-wrap">
                        <Image
                          src={primaryImage}
                          alt={product.imageAlt}
                          width={240}
                          height={180}
                          className="admin-product-card__image"
                        />
                      </div>
                      <div className="admin-product-card__summary">
                        <div className="admin-product-card__chips">
                          <span>{product.sku}</span>
                          <span>{product.imageGallery.length} صور</span>
                          <span>{product.sales} مبيعات</span>
                          <label className="admin-switch">
                            <input
                              type="checkbox"
                              checked={selectedProductIds.includes(product.id)}
                              onChange={(event) => toggleProductSelection(product.id, event.target.checked)}
                            />
                            <span>تحديد</span>
                          </label>
                        </div>
                        <label className="admin-field">
                          <span>اسم المنتج</span>
                          <input
                            className="form-input"
                            type="text"
                            value={product.name}
                            onChange={(event) => updateProductMetaField(product.id, "name", event.target.value)}
                            placeholder="اسم المنتج"
                          />
                        </label>
                        <label className="admin-field">
                          <span>وصف مختصر</span>
                          <textarea
                            className="form-input admin-product-card__textarea"
                            value={product.shortDescription}
                            onChange={(event) => updateProductMetaField(product.id, "shortDescription", event.target.value)}
                            placeholder="وصف المنتج"
                          />
                        </label>
                        <label className="admin-field">
                          <span>المميزات (سطر لكل ميزة)</span>
                          <textarea
                            className="form-input admin-product-card__textarea"
                            value={product.benefits.join("\n")}
                            onChange={(event) => updateProductMetaField(product.id, "benefits", event.target.value)}
                            placeholder="ميزة 1\nميزة 2"
                          />
                        </label>
                      </div>
                    </div>

                    <button
                      className="hero-btn hero-btn--secondary admin-product-card__delete"
                      type="button"
                      onClick={() => deleteProduct(product.id)}
                    >
                      حذف المنتج
                    </button>
                  </div>

                  <div className="admin-product-card__fields">
                    <label className="admin-field">
                      <span>القسم</span>
                      <select
                        className="form-input"
                        value={product.category}
                        onChange={(event) => updateProductMetaField(product.id, "category", event.target.value)}
                      >
                        {CATEGORY_KEYS.map((categoryKey) => (
                          <option key={categoryKey} value={categoryKey}>
                            {CATEGORY_LABELS[categoryKey]}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="admin-field">
                      <span>التقييم</span>
                      <input
                        className="form-input"
                        type="number"
                        min={1}
                        max={5}
                        step={0.1}
                        value={product.rating}
                        onChange={(event) => updateProductMetaField(product.id, "rating", event.target.value)}
                        placeholder="التقييم"
                      />
                    </label>

                    <label className="admin-field">
                      <span>السعر</span>
                      <input
                        className="form-input"
                        type="number"
                        min={1}
                        value={product.price}
                        onChange={(event) => updateProductField(product.id, "price", event.target.value)}
                      />
                    </label>

                    <label className="admin-field">
                      <span>المخزون</span>
                      <input
                        className="form-input"
                        type="number"
                        min={0}
                        value={product.stock}
                        onChange={(event) => updateProductField(product.id, "stock", event.target.value)}
                      />
                    </label>

                    <label className="admin-field">
                      <span>الشارة</span>
                      <input
                        className="form-input"
                        type="text"
                        value={product.badge}
                        onChange={(event) => updateProductField(product.id, "badge", event.target.value)}
                      />
                    </label>

                    <label className="admin-field">
                      <span>وصف الصورة</span>
                      <input
                        className="form-input"
                        type="text"
                        value={product.imageAlt}
                        onChange={(event) => updateProductTextField(product.id, "imageAlt", event.target.value)}
                        placeholder="وصف الصورة"
                      />
                    </label>
                  </div>

                  <div className="admin-product-card__gallery">
                    <div className="admin-product-card__gallery-head">
                      <div>
                        <h3 className="admin-card__subtitle">معرض الصور</h3>
                        <p className="admin-muted">الصورة الأولى تصبح الغلاف تلقائيًا.</p>
                      </div>
                      <label className="admin-switch admin-switch--block">
                        <input
                          type="checkbox"
                          checked={product.isActive}
                          onChange={(event) => updateProductField(product.id, "isActive", event.target.checked)}
                        />
                        <span>{product.isActive ? "نشط في المتجر" : "مخفي من المتجر"}</span>
                      </label>
                    </div>

                    <div className="admin-product-card__paste-row">
                      <input
                        className="form-input"
                        type="text"
                        value={imageDraftByProduct[product.id] || ""}
                        onChange={(event) =>
                          setImageDraftByProduct((prev) => ({
                            ...prev,
                            [product.id]: event.target.value,
                          }))
                        }
                        placeholder="انسخي والصقي رابط الصورة هنا"
                      />
                      <button
                        className="hero-btn hero-btn--secondary"
                        type="button"
                        onClick={() => addImageByPaste(product.id)}
                      >
                        إضافة صورة
                      </button>
                    </div>

                    <div
                      className={`admin-upload-dropzone ${draggingProductId === product.id ? "is-dragging" : ""}`}
                      onDragOver={(event) => {
                        event.preventDefault();
                        setDraggingProductId(product.id);
                      }}
                      onDragLeave={() => setDraggingProductId((current) => (current === product.id ? null : current))}
                      onDrop={(event) => handleImageDrop(product.id, event)}
                    >
                      <div>
                        <p className="admin-upload-dropzone__title">اسحبي الصور هنا وأفلتيها</p>
                        <p className="admin-upload-dropzone__hint">أو اختاري الصور من جهازك وسيتم ضغطها تلقائيًا قبل الإضافة.</p>
                      </div>
                      <label className="hero-btn hero-btn--secondary admin-upload-dropzone__button">
                        {uploadingProductIds[product.id] ? "جارٍ رفع الصور..." : "اختيار من الجهاز"}
                        <input
                          className="admin-upload-dropzone__input"
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(event) => void handleImageInputChange(product.id, event)}
                        />
                      </label>
                    </div>

                    <label className="admin-field admin-product-card__main-image">
                      <span>رابط صورة الغلاف</span>
                      <input
                        className="form-input"
                        type="text"
                        value={product.imagePath}
                        onChange={(event) => updateProductTextField(product.id, "imagePath", event.target.value)}
                        placeholder="الصورة الرئيسية"
                      />
                    </label>

                    <div className="admin-gallery-list">
                      {product.imageGallery.map((image) => (
                        <div
                          key={`${product.id}-${image}`}
                          className={`admin-gallery-item ${product.imagePath === image ? "is-cover" : ""}`}
                        >
                          <span className="admin-gallery-item__path">{image}</span>
                          <div className="admin-gallery-item__actions">
                            {product.imagePath === image ? (
                              <span className="admin-gallery-item__cover-badge">صورة الغلاف</span>
                            ) : (
                              <button
                                className="admin-gallery-item__cover"
                                type="button"
                                onClick={() => setGalleryCover(product.id, image)}
                              >
                                تعيين كغلاف
                              </button>
                            )}
                            <button
                              className="admin-gallery-item__delete"
                              type="button"
                              onClick={() => removeGalleryImage(product.id, image)}
                            >
                              حذف
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <label className="admin-field">
                      <span>كل روابط الصور</span>
                      <textarea
                        className="form-input admin-product-card__textarea admin-product-card__textarea--tall"
                        value={product.imageGallery.join("\n")}
                        onChange={(event) => updateProductTextField(product.id, "imageGallery", event.target.value)}
                        placeholder="رابط كل صورة في سطر منفصل"
                      />
                    </label>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      {currentTab === "offers" ? (
        <section className="admin-card admin-products-shell">
          <div className="admin-products-toolbar">
            <div>
              <h2>إدارة العروض</h2>
              <p className="admin-muted">تحكّم في العروض النشطة، الكوبونات، روابط التوجيه، وشروط الخصم من مكان واحد.</p>
            </div>
            <div className="admin-inline-actions">
              <button className="hero-btn hero-btn--secondary" type="button" onClick={addNewOffer}>
                إضافة عرض
              </button>
              <button className="hero-btn hero-btn--primary" type="button" onClick={saveOffers}>
                حفظ العروض
              </button>
            </div>
          </div>

          <div className="admin-products-grid">
            {offers.map((offer) => (
              <article key={offer.id} className="admin-product-card">
                <div className="admin-product-card__top">
                  <div className="admin-product-card__summary">
                    <div className="admin-product-card__chips">
                      <span>{offer.id}</span>
                      <span>{offer.badge}</span>
                      <label className="admin-switch">
                        <input
                          type="checkbox"
                          checked={offer.isEnabled}
                          onChange={(event) =>
                            updateOffer(offer.id, (current) => ({ ...current, isEnabled: event.target.checked }))
                          }
                        />
                        <span>{offer.isEnabled ? "نشط" : "موقوف"}</span>
                      </label>
                    </div>

                    <label className="admin-field">
                      <span>عنوان العرض</span>
                      <input
                        className="form-input"
                        type="text"
                        value={offer.title}
                        onChange={(event) => updateOffer(offer.id, (current) => ({ ...current, title: event.target.value }))}
                      />
                    </label>

                    <label className="admin-field">
                      <span>تفاصيل العرض</span>
                      <textarea
                        className="form-input admin-product-card__textarea"
                        value={offer.details}
                        onChange={(event) => updateOffer(offer.id, (current) => ({ ...current, details: event.target.value }))}
                      />
                    </label>
                  </div>

                  <button
                    className="hero-btn hero-btn--secondary admin-product-card__delete"
                    type="button"
                    onClick={() => deleteOffer(offer.id)}
                  >
                    حذف العرض
                  </button>
                </div>

                <div className="admin-product-card__fields">
                  <label className="admin-field">
                    <span>شارة العرض</span>
                    <input
                      className="form-input"
                      type="text"
                      value={offer.badge}
                      onChange={(event) => updateOffer(offer.id, (current) => ({ ...current, badge: event.target.value }))}
                    />
                  </label>

                  <label className="admin-field">
                    <span>رابط التوجيه</span>
                    <input
                      className="form-input"
                      type="text"
                      value={offer.href}
                      onChange={(event) => updateOffer(offer.id, (current) => ({ ...current, href: event.target.value }))}
                    />
                  </label>

                  <label className="admin-field">
                    <span>تاريخ الانتهاء</span>
                    <input
                      className="form-input"
                      type="datetime-local"
                      value={offer.expiresAt.slice(0, 16)}
                      onChange={(event) =>
                          updateOffer(offer.id, (current) => ({
                            ...current,
                            expiresAt: parseDateTimeLocalToIso(event.target.value, current.expiresAt),
                          }))
                      }
                    />
                  </label>

                  <label className="admin-field">
                    <span>خصم بالنسبة %</span>
                    <input
                      className="form-input"
                      type="number"
                      min={0}
                      max={100}
                      value={offer.discountPercent || ""}
                      onChange={(event) =>
                        updateOffer(offer.id, (current) => ({
                          ...current,
                          discountPercent: event.target.value ? Number(event.target.value) : undefined,
                        }))
                      }
                    />
                  </label>

                  <label className="admin-field">
                    <span>خصم ثابت</span>
                    <input
                      className="form-input"
                      type="number"
                      min={0}
                      value={offer.discountFixed || ""}
                      onChange={(event) =>
                        updateOffer(offer.id, (current) => ({
                          ...current,
                          discountFixed: event.target.value ? Number(event.target.value) : undefined,
                        }))
                      }
                    />
                  </label>

                  <label className="admin-field">
                    <span>كود الكوبون</span>
                    <input
                      className="form-input"
                      type="text"
                      value={offer.couponCode || ""}
                      onChange={(event) =>
                        updateOffer(offer.id, (current) => ({ ...current, couponCode: event.target.value.toUpperCase() || undefined }))
                      }
                    />
                  </label>

                  <label className="admin-field">
                    <span>حد أدنى للسلة</span>
                    <input
                      className="form-input"
                      type="number"
                      min={0}
                      value={offer.rule.minSubtotal || ""}
                      onChange={(event) =>
                        updateOffer(offer.id, (current) => ({
                          ...current,
                          rule: {
                            ...current.rule,
                            minSubtotal: event.target.value ? Number(event.target.value) : undefined,
                          },
                        }))
                      }
                    />
                  </label>

                  <label className="admin-field">
                    <span>الفئة المستهدفة</span>
                    <select
                      className="form-input"
                      value={offer.rule.category || "all"}
                      onChange={(event) =>
                        updateOffer(offer.id, (current) => ({
                          ...current,
                          rule: {
                            ...current.rule,
                            category: event.target.value === "all" ? undefined : (event.target.value as ProductCategory),
                          },
                        }))
                      }
                    >
                      <option value="all">كل الفئات</option>
                      {CATEGORY_KEYS.map((categoryKey) => (
                        <option key={categoryKey} value={categoryKey}>
                          {CATEGORY_LABELS[categoryKey]}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="admin-switch admin-switch--block">
                    <input
                      type="checkbox"
                      checked={Boolean(offer.freeShipping)}
                      onChange={(event) =>
                        updateOffer(offer.id, (current) => ({ ...current, freeShipping: event.target.checked }))
                      }
                    />
                    <span>شحن مجاني</span>
                  </label>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {currentTab === "orders" ? (
        <section className="admin-card">
          <h2>إدارة الطلبات</h2>
          {orders.length === 0 ? (
            <p className="admin-muted">لا توجد طلبات بعد.</p>
          ) : (
            <div className="admin-list-grid">
              {orders.map((order) => (
                <article key={order.id} className="admin-order-card">
                  <div className="admin-head-row">
                    <p className="admin-order-card__id">{order.id}</p>
                    <select
                      className="form-input"
                      value={order.status}
                      onChange={(event) => handleStatusChange(order.id, event.target.value as AdminOrderStatus)}
                    >
                      {(Object.keys(STATUS_LABELS) as AdminOrderStatus[]).map((status) => (
                        <option key={status} value={status}>
                          {STATUS_LABELS[status]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="admin-muted">{formatDate(order.createdAt)}</p>
                  <p className="admin-order-card__customer">{order.customerName}</p>
                  <p className="admin-muted">{order.phone} • {order.city}</p>
                  <p className="admin-muted">الدفع عبر: {order.paymentMethodLabel}</p>
                  <p className="admin-muted">اسم المحوّل: {order.payerName}</p>
                  <p className="admin-muted">مرجع الحوالة: {order.paymentReference || "غير متوفر"}</p>
                  {order.paymentReceiptImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={order.paymentReceiptImage}
                      alt={`سند حوالة ${order.id}`}
                      className="mt-2 h-28 w-full rounded-2xl border border-zinc-200 object-cover"
                    />
                  ) : (
                    <p className="admin-muted">سند التحويل: غير مرفق</p>
                  )}
                  <select
                    className="form-input mt-2"
                    value={order.paymentStatus}
                    onChange={(event) => handlePaymentStatusChange(order.id, event.target.value as AdminOrderPaymentStatus)}
                  >
                    {(Object.keys(PAYMENT_STATUS_LABELS) as AdminOrderPaymentStatus[]).map((status) => (
                      <option key={status} value={status}>
                        {PAYMENT_STATUS_LABELS[status]}
                      </option>
                    ))}
                  </select>
                  <p className="admin-order-card__total">{formatCurrency(order.total, settings.currencySymbol)}</p>
                  <ul className="admin-list">
                    {order.items.map((item) => (
                      <li key={`${order.id}-${item.productId}`}>
                        {item.name} × {item.quantity}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {currentTab === "leads" ? (
        <section className="admin-card">
          <h2>رسائل العملاء والاستشارات</h2>
          {leads.length === 0 ? (
            <p className="admin-muted">لا توجد رسائل مسجلة بعد.</p>
          ) : (
            <div className="admin-list-grid">
              {leads.map((lead) => (
                <article key={lead.id} className="admin-order-card">
                  <div className="admin-head-row">
                    <p className="admin-order-card__id">{lead.ticketNumber}</p>
                    <select
                      className="form-input"
                      value={lead.status}
                      onChange={(event) => handleLeadStatusChange(lead.id, event.target.value as AdminLeadStatus)}
                    >
                      {(Object.keys(LEAD_STATUS_LABELS) as AdminLeadStatus[]).map((status) => (
                        <option key={status} value={status}>
                          {LEAD_STATUS_LABELS[status]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="admin-muted">{formatDate(lead.createdAt)}</p>
                  <p className="admin-order-card__customer">{lead.name}</p>
                  <p className="admin-muted">{lead.phone}</p>
                  <p className="admin-muted">الأولوية: {lead.priority}</p>
                  <p className="admin-muted">نوع البشرة/الشعر: {lead.profileType || "غير محدد"}</p>
                  {lead.selectedProductName ? (
                    <p className="admin-muted">المنتج المطلوب: {lead.selectedProductName}</p>
                  ) : null}
                  {lead.notes ? <p className="admin-order-card__note">{lead.notes}</p> : null}
                </article>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {currentTab === "audit" ? (
        <section className="admin-card">
          <h2>سجل التدقيق</h2>
          {auditLogs.length === 0 ? (
            <p className="admin-muted">لا توجد أحداث مسجلة بعد.</p>
          ) : (
            <div className="admin-list-grid">
              {auditLogs.map((log) => (
                <article key={log.id} className="admin-order-card">
                  <p className="admin-order-card__id">{log.action}</p>
                  <p className="admin-muted">{formatDate(log.createdAt)}</p>
                  <p className="admin-muted">الدور: {ROLE_LABELS[log.actor]}</p>
                  <p className="admin-muted">الكيان: {log.entityType}</p>
                  <p className="admin-order-card__note">{log.details}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {currentTab === "reports" ? (
        <section className="admin-card">
          <h2>التقارير</h2>
          <p className="admin-muted">
            تصدير تقرير CSV يشمل المنتجات والطلبات والتذاكر مع آخر التحديثات.
          </p>
          <div className="admin-actions mt-4">
            <button className="hero-btn hero-btn--primary" type="button" onClick={handleExportReports}>
              تصدير تقرير CSV
            </button>
            <button className="hero-btn hero-btn--secondary" type="button" onClick={handleExportBackup}>
              تنزيل نسخة احتياطية JSON
            </button>
            <label className="hero-btn hero-btn--secondary">
              استيراد نسخة احتياطية
              <input className="admin-upload-dropzone__input" type="file" accept="application/json" onChange={(event) => void handleImportBackup(event)} />
            </label>
            <button className="hero-btn hero-btn--secondary" type="button" onClick={refreshData}>
              تحديث البيانات
            </button>
          </div>
        </section>
      ) : null}

      {currentTab === "settings" ? (
        <section className="admin-card admin-settings-grid">
          <div>
            <h2>الإعدادات العامة</h2>
            <p className="admin-muted">هذه الإعدادات تؤثر مباشرة على صفحة الدفع والتواصل.</p>
          </div>

          <label className="admin-field">
            <span>رقم واتساب الطلبات</span>
            <input
              className="form-input"
              type="text"
              value={settings.whatsappNumber}
              onChange={(event) =>
                setSettings((prev) => ({
                  ...prev,
                  whatsappNumber: normalizeDigits(event.target.value).replace(/\D/g, ""),
                }))
              }
            />
          </label>

          <label className="admin-field">
            <span>البريد الإلكتروني للدعم</span>
            <input
              className="form-input"
              type="email"
              value={settings.supportEmail}
              onChange={(event) =>
                setSettings((prev) => ({
                  ...prev,
                  supportEmail: event.target.value,
                }))
              }
            />
          </label>

          <div className="admin-field lg:col-span-2">
            <span>شعار الموقع (من الملفات)</span>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={settings.brandLogoPath || "/brand/sir-aljamal-logo.svg"}
                alt="معاينة الشعار"
                className="h-14 w-14 rounded-full border border-zinc-200 bg-white object-cover"
              />
              <label className="hero-btn hero-btn--secondary">
                اختيار شعار من الملفات
                <input
                  className="admin-upload-dropzone__input"
                  type="file"
                  accept="image/*"
                  onChange={(event) => void handleLogoFileChange(event)}
                />
              </label>
              <button
                className="hero-btn hero-btn--secondary"
                type="button"
                onClick={() =>
                  setSettings((prev) => ({
                    ...prev,
                    brandLogoPath: "/brand/sir-aljamal-logo.svg",
                  }))
                }
              >
                إعادة للشعار الافتراضي
              </button>
            </div>
          </div>

          <label className="admin-field">
            <span>عنوان قسم التواصل في الفوتر</span>
            <input
              className="form-input"
              type="text"
              value={settings.footerContactTitle}
              onChange={(event) =>
                setSettings((prev) => ({
                  ...prev,
                  footerContactTitle: event.target.value,
                }))
              }
            />
          </label>

          <label className="admin-field lg:col-span-2">
            <span>نص ساعات العمل</span>
            <input
              className="form-input"
              type="text"
              value={settings.workingHoursLabel}
              onChange={(event) =>
                setSettings((prev) => ({
                  ...prev,
                  workingHoursLabel: event.target.value,
                }))
              }
            />
          </label>

          <label className="admin-field">
            <span>العملة</span>
            <select
              className="form-input"
              value={settings.currencyCode}
              onChange={(event) => {
                const nextCode = event.target.value as DashboardSettings["currencyCode"];
                const symbolByCode: Record<DashboardSettings["currencyCode"], string> = {
                  SAR: "ر.س",
                  YER: "ر.ي",
                  USD: "$",
                };
                setSettings((prev) => ({
                  ...prev,
                  currencyCode: nextCode,
                  currencySymbol: symbolByCode[nextCode],
                }));
              }}
            >
              <option value="SAR">ريال سعودي (SAR)</option>
              <option value="YER">ريال يمني (YER)</option>
              <option value="USD">دولار أمريكي (USD)</option>
            </select>
          </label>

          <label className="admin-field">
            <span>رمز العملة</span>
            <input
              className="form-input"
              type="text"
              value={settings.currencySymbol}
              onChange={(event) =>
                setSettings((prev) => ({
                  ...prev,
                  currencySymbol: event.target.value,
                }))
              }
            />
          </label>

          <label className="admin-field">
            <span>اسم المحفظة الأساسية</span>
            <input
              className="form-input"
              type="text"
              value={settings.walletName}
              onChange={(event) =>
                setSettings((prev) => ({
                  ...prev,
                  walletName: event.target.value,
                }))
              }
            />
          </label>

          <label className="admin-field">
            <span>رقم حساب المحفظة الأساسية</span>
            <input
              className="form-input"
              type="text"
              value={settings.walletAccountNumber}
              onChange={(event) =>
                setSettings((prev) => ({
                  ...prev,
                  walletAccountNumber: event.target.value,
                }))
              }
            />
          </label>

          <div className="admin-field lg:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span>وسائل الدفع والتحويل</span>
              <button className="hero-btn hero-btn--secondary" type="button" onClick={addPaymentMethod}>
                إضافة وسيلة دفع
              </button>
            </div>
            <div className="mt-3 grid gap-3">
              {settings.paymentMethods.map((method) => (
                <article key={method.id} className="rounded-2xl border border-zinc-200 bg-white p-3">
                  <div className="grid gap-2 md:grid-cols-2">
                    <input className="form-input" type="text" value={method.name} placeholder="اسم الوسيلة" onChange={(event) => updatePaymentMethod(method.id, (current) => ({ ...current, name: event.target.value }))} />
                    <input className="form-input" type="text" value={method.provider} placeholder="المزود" onChange={(event) => updatePaymentMethod(method.id, (current) => ({ ...current, provider: event.target.value }))} />
                    <input className="form-input" type="text" value={method.accountName} placeholder="اسم الحساب" onChange={(event) => updatePaymentMethod(method.id, (current) => ({ ...current, accountName: event.target.value }))} />
                    <input className="form-input" type="text" value={method.accountNumber} placeholder="رقم الحساب أو المحفظة" onChange={(event) => updatePaymentMethod(method.id, (current) => ({ ...current, accountNumber: event.target.value }))} />
                    <textarea className="form-input md:col-span-2" rows={3} value={method.instructions} placeholder="تعليمات التحويل" onChange={(event) => updatePaymentMethod(method.id, (current) => ({ ...current, instructions: event.target.value }))} />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <label className="admin-switch admin-switch--block">
                      <input type="checkbox" checked={method.isEnabled} onChange={(event) => updatePaymentMethod(method.id, (current) => ({ ...current, isEnabled: event.target.checked }))} />
                      <span>{method.isEnabled ? "مفعلة" : "موقوفة"}</span>
                    </label>
                    <button className="hero-btn hero-btn--secondary" type="button" onClick={() => removePaymentMethod(method.id)}>
                      حذف الوسيلة
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <label className="admin-field">
            <span>حد المخزون المنخفض</span>
            <input
              className="form-input"
              type="number"
              min={1}
              value={settings.lowStockThreshold}
              onChange={(event) =>
                setSettings((prev) => ({
                  ...prev,
                  lowStockThreshold: Math.max(1, Number(event.target.value) || 1),
                }))
              }
            />
          </label>

          <label className="admin-switch admin-switch--block">
            <input
              type="checkbox"
              checked={settings.smartMode}
              onChange={(event) =>
                setSettings((prev) => ({
                  ...prev,
                  smartMode: event.target.checked,
                }))
              }
            />
            <span>تفعيل وضع التوصيات الذكية</span>
          </label>

          <label className="admin-field">
            <span>رمز دخول لوحة الإدارة</span>
            <input
              className="form-input"
              type="text"
              value={settings.adminPin}
              onChange={(event) =>
                setSettings((prev) => ({
                  ...prev,
                  adminPin: event.target.value,
                }))
              }
            />
          </label>

          <div className="admin-actions">
            <button className="hero-btn hero-btn--primary" type="button" onClick={() => void handleSaveSettings()}>
              حفظ الإعدادات
            </button>
            <button className="hero-btn hero-btn--secondary" type="button" onClick={refreshData}>
              تحديث البيانات
            </button>
            <button className="hero-btn hero-btn--secondary" type="button" onClick={handleSmartReset}>
              مسح الطلبات والرسائل
            </button>
          </div>
        </section>
      ) : null}
    </main>
  );
}
