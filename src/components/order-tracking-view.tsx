"use client";

import { useState } from "react";
import Link from "next/link";
import { formatArabicDateWithEnglishDigits, normalizeToEnglishDigits } from "@/lib/digits";
import { useDashboardSettingsLive } from "@/lib/use-dashboard-settings-live";
import { useHydrated } from "@/lib/use-hydrated";

const STATUS_LABELS: Record<string, string> = {
  new: "جديد",
  processing: "قيد التجهيز",
  shipped: "تم الشحن",
  completed: "مكتمل",
  cancelled: "ملغي",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending_transfer: "بانتظار إثبات الحوالة",
  under_review: "الحوالة تحت المراجعة",
  paid: "تم تأكيد الدفع",
  rejected: "مرفوضة أو بحاجة تصحيح",
};

function formatCurrency(value: number, symbol: string) {
  return `${Math.round(value)} ${symbol}`;
}

function formatDate(value: string) {
  return formatArabicDateWithEnglishDigits(value);
}

export default function OrderTrackingView() {
  const hydrated = useHydrated();
  const settings = useDashboardSettingsLive();
  const [orderId, setOrderId] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    id: string;
    createdAt: string;
    status: string;
    paymentStatus: string;
    paymentMethodLabel: string;
    items: Array<{ productId: string; name: string; price: number; quantity: number; lineTotal: number }>;
    subtotal: number;
    deliveryFee: number;
    total: number;
  } | null>(null);
  const currencySymbol = hydrated ? settings.currencySymbol : "ر.س";

  async function handleLookup() {
    const normalized = normalizeToEnglishDigits(orderId).trim().toUpperCase();
    if (!normalized) {
      setError("أدخلي رقم الطلب أولًا.");
      setResult(null);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/orders/track?ref=${encodeURIComponent(normalized)}`, {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        setError("لم نجد هذا الطلب. تأكدي من الرقم أو تواصلي مع الدعم.");
        setResult(null);
        return;
      }

      const payload = (await response.json()) as {
        ok?: boolean;
        order?: {
          id: string;
          createdAt: string;
          status: string;
          paymentStatus: string;
          paymentMethodLabel: string;
          items: Array<{ productId: string; name: string; price: number; quantity: number; lineTotal: number }>;
          subtotal: number;
          deliveryFee: number;
          total: number;
        };
      };

      if (!payload.ok || !payload.order) {
        setError("لم نجد هذا الطلب. تأكدي من الرقم أو تواصلي مع الدعم.");
        setResult(null);
        return;
      }

      setError("");
      setResult(payload.order);
    } catch {
      setError("تعذر الاتصال بالخادم الآن. حاولي مرة أخرى.");
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="inner-page site-shell" dir="rtl">
      <section className="inner-page__hero">
        <p className="inner-page__kicker">تتبع الطلب</p>
        <h1 className="inner-page__title">تابعي حالة طلبك بسهولة</h1>
        <p className="inner-page__desc">أدخلي رقم الطلب لمعرفة حالته الحالية والعناصر المسجلة ومعلومات الشحن.</p>
      </section>

      <section className="product-detail-card mt-4">
        <h2>البحث عن الطلب</h2>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            className="form-input"
            type="text"
            placeholder="مثال: ORD-2026-123456"
            value={orderId}
            onChange={(event) => setOrderId(normalizeToEnglishDigits(event.target.value))}
          />
          <button className="hero-btn hero-btn--primary" type="button" onClick={() => void handleLookup()}>
            {isLoading ? "جارٍ البحث..." : "تتبع الآن"}
          </button>
        </div>
        {error ? <p className="mt-3 text-sm font-black text-red-700">{error}</p> : null}
      </section>

      {result ? (
        <section className="product-detail-card mt-4">
          <h2>تفاصيل الطلب</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <article className="info-strip__card">
              <p className="info-strip__label">رقم الطلب</p>
              <p className="info-strip__value">{result.id}</p>
            </article>
            <article className="info-strip__card">
              <p className="info-strip__label">الحالة</p>
              <p className="info-strip__value">{STATUS_LABELS[result.status] || result.status}</p>
            </article>
            <article className="info-strip__card">
              <p className="info-strip__label">تاريخ الإنشاء</p>
              <p className="info-strip__value">{formatDate(result.createdAt)}</p>
            </article>
            <article className="info-strip__card">
              <p className="info-strip__label">الإجمالي</p>
              <p className="info-strip__value">{formatCurrency(result.total, currencySymbol)}</p>
            </article>
            <article className="info-strip__card">
              <p className="info-strip__label">الدفع</p>
              <p className="info-strip__value">{PAYMENT_STATUS_LABELS[result.paymentStatus] || result.paymentStatus}</p>
            </article>
            <article className="info-strip__card">
              <p className="info-strip__label">وسيلة التحويل</p>
              <p className="info-strip__value">{result.paymentMethodLabel}</p>
            </article>
          </div>
          <div className="mt-4 grid gap-2">
            {result.items.map((item) => (
              <article key={`${result.id}-${item.productId}`} className="rounded-2xl border border-orange-100 bg-orange-50 p-3">
                <p className="text-sm font-black text-zinc-900">{item.name}</p>
                <p className="mt-1 text-xs text-zinc-600">الكمية: {item.quantity}</p>
                <p className="mt-1 text-xs font-black text-orange-700">{formatCurrency(item.lineTotal, currencySymbol)}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <div className="inner-page__actions">
        <Link className="hero-btn hero-btn--secondary" href="/contact">
          تواصل مع الدعم
        </Link>
        <Link className="hero-btn hero-btn--secondary" href="/policies">
          السياسات
        </Link>
      </div>
    </main>
  );
}
