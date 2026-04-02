"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addAdminAuditLog,
  buildDashboardInsights,
  clearAdminData,
  exportAdminReportCsv,
  getAdminAuditLogs,
  getAdminLeads,
  getAdminOrders,
  getAdminProducts,
  getDashboardSettings,
  saveAdminProducts,
  saveDashboardSettings,
  updateAdminLeadStatus,
  updateAdminOrderStatus,
  type AdminLeadStatus,
  type AdminRole,
  type AdminOrderStatus,
  type DashboardSettings,
} from "@/lib/admin-storage";
import { pullAdminStateFromServer, pushAdminStateToServer } from "@/lib/admin-sync";

const TABS = [
  { id: "overview", label: "نظرة عامة" },
  { id: "products", label: "إدارة المنتجات" },
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
  owner: ["overview", "products", "orders", "leads", "audit", "reports", "settings"],
  staff: ["overview", "products", "orders", "reports"],
  support: ["overview", "leads", "orders", "reports"],
};

function formatCurrency(value: number) {
  return `${Math.round(value)} ر.س`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("ar-SA", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [role, setRole] = useState<AdminRole>("owner");
  const [products, setProducts] = useState(() => getAdminProducts());
  const [orders, setOrders] = useState(() => getAdminOrders());
  const [leads, setLeads] = useState(() => getAdminLeads());
  const [auditLogs, setAuditLogs] = useState(() => getAdminAuditLogs());
  const [settings, setSettings] = useState<DashboardSettings>(() => getDashboardSettings());
  const [notice, setNotice] = useState<string>("");

  const insights = useMemo(
    () => buildDashboardInsights(products, orders, leads, settings),
    [products, orders, leads, settings],
  );

  function refreshData() {
    setProducts(getAdminProducts());
    setOrders(getAdminOrders());
    setLeads(getAdminLeads());
    setAuditLogs(getAdminAuditLogs());
    setSettings(getDashboardSettings());
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

  function setSuccess(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 1800);
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
          next.stock = Math.max(0, Number(value) || 0);
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

  function saveProducts() {
    saveAdminProducts(products);
    setProducts(getAdminProducts());
    addAdminAuditLog({
      actor: role,
      action: "save_products",
      entityType: "product",
      details: "تم حفظ تعديلات المنتجات من لوحة الإدارة",
    });
    setSuccess("تم حفظ تعديلات المنتجات");
    void pushAdminStateToServer();
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

  function handleSaveSettings() {
    saveDashboardSettings(settings);
    addAdminAuditLog({
      actor: role,
      action: "save_settings",
      entityType: "settings",
      details: "تم تحديث إعدادات النظام",
    });
    setSettings(getDashboardSettings());
    setAuditLogs(getAdminAuditLogs());
    setSuccess("تم حفظ الإعدادات");
    void pushAdminStateToServer();
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

  async function handlePullFromServer() {
    const ok = await pullAdminStateFromServer();
    refreshData();
    setSuccess(ok ? "تم جلب أحدث البيانات من السيرفر" : "تعذر جلب البيانات من السيرفر");
  }

  async function handlePushToServer() {
    const ok = await pushAdminStateToServer();
    setSuccess(ok ? "تم رفع البيانات الحالية إلى السيرفر" : "تعذر رفع البيانات إلى السيرفر");
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
        {(Object.keys(ROLE_LABELS) as AdminRole[]).map((roleKey) => (
          <button
            key={roleKey}
            type="button"
            className={`hero-btn ${role === roleKey ? "hero-btn--primary" : "hero-btn--secondary"}`}
            onClick={() => setRole(roleKey)}
          >
            {ROLE_LABELS[roleKey]}
          </button>
        ))}
        <button className="hero-btn hero-btn--secondary" type="button" onClick={handlePullFromServer}>
          مزامنة من السيرفر
        </button>
        <button className="hero-btn hero-btn--secondary" type="button" onClick={handlePushToServer}>
          رفع إلى السيرفر
        </button>
      </section>

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
            <p className="admin-metric__value">{formatCurrency(insights.revenue)}</p>
          </article>
          <article className="admin-metric">
            <p className="admin-metric__label">عدد الطلبات</p>
            <p className="admin-metric__value">{insights.ordersCount}</p>
          </article>
          <article className="admin-metric">
            <p className="admin-metric__label">متوسط الطلب</p>
            <p className="admin-metric__value">{formatCurrency(insights.avgOrderValue)}</p>
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
        <section className="admin-card">
          <div className="admin-head-row">
            <h2>إدارة المنتجات</h2>
            <button className="hero-btn hero-btn--primary" type="button" onClick={saveProducts}>
              حفظ التعديلات
            </button>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>المنتج</th>
                  <th>السعر</th>
                  <th>المخزون</th>
                  <th>الشارة</th>
                  <th>الحالة</th>
                  <th>المبيعات</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <strong>{product.name}</strong>
                      <p className="admin-muted">{product.sku}</p>
                    </td>
                    <td>
                      <input
                        className="form-input"
                        type="number"
                        min={1}
                        value={product.price}
                        onChange={(event) => updateProductField(product.id, "price", event.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        className="form-input"
                        type="number"
                        min={0}
                        value={product.stock}
                        onChange={(event) => updateProductField(product.id, "stock", event.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        className="form-input"
                        type="text"
                        value={product.badge}
                        onChange={(event) => updateProductField(product.id, "badge", event.target.value)}
                      />
                    </td>
                    <td>
                      <label className="admin-switch">
                        <input
                          type="checkbox"
                          checked={product.isActive}
                          onChange={(event) => updateProductField(product.id, "isActive", event.target.checked)}
                        />
                        <span>{product.isActive ? "نشط" : "متوقف"}</span>
                      </label>
                    </td>
                    <td>{product.sales}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                  <p className="admin-order-card__total">{formatCurrency(order.total)}</p>
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
                setSettings((prev) => ({ ...prev, whatsappNumber: event.target.value.replace(/\D/g, "") }))
              }
            />
          </label>

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
            <button className="hero-btn hero-btn--primary" type="button" onClick={handleSaveSettings}>
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
