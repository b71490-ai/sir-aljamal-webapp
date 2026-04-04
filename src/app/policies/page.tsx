"use client";

import Link from "next/link";
import { useState } from "react";
import { getAdminOrders } from "@/lib/admin-storage";
import { normalizeToEnglishDigits } from "@/lib/digits";
import { useDashboardSettingsLive } from "@/lib/use-dashboard-settings-live";

export default function PoliciesPage() {
  const [orderId, setOrderId] = useState("");
  const [orderResult, setOrderResult] = useState<{ status: string; total: number } | null>(null);
  const [lookupError, setLookupError] = useState("");
  const settings = useDashboardSettingsLive();
  const currencySymbol = settings.currencySymbol;
  const whatsappNumber = settings.whatsappNumber;
  const supportEmail = settings.supportEmail;

  function handleLookup() {
    const normalized = normalizeToEnglishDigits(orderId).trim().toUpperCase();
    if (!normalized) {
      setLookupError("أدخلي رقم الطلب أولاً.");
      setOrderResult(null);
      return;
    }

    const order = getAdminOrders().find((item) => item.id.toUpperCase() === normalized);
    if (!order) {
      setLookupError("لم يتم العثور على هذا الطلب.");
      setOrderResult(null);
      return;
    }

    setLookupError("");
    setOrderResult({ status: order.status, total: order.total });
  }

  return (
    <main className="inner-page site-shell" dir="rtl">
      <section className="inner-page__hero">
        <p className="inner-page__kicker">السياسات</p>
        <h1 className="inner-page__title">سياسات سر الجمال</h1>
        <p className="inner-page__desc">شفافية كاملة في الشحن، الاستبدال، والاسترجاع لضمان تجربة آمنة.</p>
      </section>

      <section className="info-strip" aria-label="ملخص السياسات">
        <article className="info-strip__card">
          <p className="info-strip__value">4-24h</p>
          <p className="info-strip__label">وقت الشحن</p>
        </article>
        <article className="info-strip__card">
          <p className="info-strip__value">7 أيام</p>
          <p className="info-strip__label">مهلة الاسترجاع</p>
        </article>
        <article className="info-strip__card">
          <p className="info-strip__value">100%</p>
          <p className="info-strip__label">حماية الدفع</p>
        </article>
      </section>

      <section className="policy-list" aria-label="سياسات المتجر">
        <article className="policy-card">
          <h2>سياسة الشحن</h2>
          <p>توصيل خلال 4-24 ساعة في المدن الرئيسية، وقد يختلف حسب موقع العميل.</p>
        </article>
        <article className="policy-card">
          <h2>الاستبدال والاسترجاع</h2>
          <p>يُقبل خلال 7 أيام للمنتجات غير المفتوحة مع وجود فاتورة الشراء.</p>
        </article>
        <article className="policy-card">
          <h2>سياسة الدفع</h2>
          <p>نقبل بطاقات مدى وفيزا وماستركارد مع حماية كاملة لبيانات الدفع.</p>
        </article>
      </section>

      <section className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4">
        <h2 className="text-lg font-black text-zinc-900">متابعة طلب أو استرجاع</h2>
        <p className="mt-2 text-sm text-zinc-700">أدخلي رقم الطلب لمعرفة الحالة الحالية قبل فتح طلب استرجاع.</p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            className="form-input"
            type="text"
            placeholder="مثال: ORD-2026-123456"
            value={orderId}
            onChange={(event) => setOrderId(normalizeToEnglishDigits(event.target.value))}
          />
          <button className="hero-btn hero-btn--primary" type="button" onClick={handleLookup}>
            تحقق
          </button>
        </div>
        {lookupError ? <p className="mt-2 text-sm font-black text-red-700">{lookupError}</p> : null}
        {orderResult ? (
          <p className="mt-2 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm font-black text-green-800">
            حالة الطلب: {orderResult.status} • القيمة: {Math.round(orderResult.total)} {currencySymbol}
          </p>
        ) : null}
        <div className="mt-3">
          <Link className="mini-link" href="/track-order">
            فتح صفحة التتبع الكاملة
          </Link>
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4">
        <h2 className="text-lg font-black text-zinc-900">الأسئلة الشائعة</h2>
        <div className="mt-3 space-y-2">
          <details className="faq-item" open>
            <summary>متى يمكنني طلب الاسترجاع؟</summary>
            <p>خلال 7 أيام من تاريخ الاستلام إذا كان المنتج غير مفتوح.</p>
          </details>
          <details className="faq-item">
            <summary>هل أتحمل رسوم الشحن في حالة الاسترجاع؟</summary>
            <p>في حال وجود عيب مصنعي تتحمل المنصة كامل الرسوم، غير ذلك تطبق سياسة الشحن المعتمدة.</p>
          </details>
          <details className="faq-item">
            <summary>كم يستغرق رد المبلغ؟</summary>
            <p>عادة من 3 إلى 7 أيام عمل بعد قبول طلب الاسترجاع.</p>
          </details>
        </div>
      </section>

      <div className="inner-page__actions">
        <a className="hero-btn hero-btn--primary" href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noreferrer">
          استفسار عن الطلب
        </a>
        <a className="hero-btn hero-btn--secondary" href={`mailto:${supportEmail}`}>
          تواصل بالبريد
        </a>
        <Link className="hero-btn hero-btn--secondary" href="/store">
          العودة للمتجر
        </Link>
        <Link className="hero-btn hero-btn--secondary" href="/track-order">
          تتبع الطلب
        </Link>
      </div>
    </main>
  );
}
