"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getActiveOffers, getSecondsLeft } from "@/data/offers";
import { useHydrated } from "@/lib/use-hydrated";
import { useStorefrontPublicState } from "@/lib/use-storefront-public-state";

function formatCountdown(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
}

export default function OffersPage() {
  const hydrated = useHydrated();
  const [now, setNow] = useState(new Date());
  const storefrontState = useStorefrontPublicState();
  const referenceDate = hydrated ? now : null;

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const offers = useMemo(() => (referenceDate ? getActiveOffers(referenceDate, storefrontState.offers) : []), [referenceDate, storefrontState.offers]);
  const nearestExpiry = offers[0]?.expiresAt;
  const activeCoupons = offers.filter((offer) => offer.couponCode).map((offer) => offer.couponCode);

  return (
    <main className="inner-page site-shell" dir="rtl">
      <section className="inner-page__hero">
        <p className="inner-page__kicker">العروض</p>
        <h1 className="inner-page__title">عروض سر الجمال اليومية</h1>
        <p className="inner-page__desc">استفيدي من أقوى الخصومات قبل انتهاء الوقت المحدد لكل عرض.</p>
        {nearestExpiry ? (
          <p className="mt-3 inline-flex rounded-full border border-orange-300 bg-orange-50 px-3 py-1 text-sm font-black text-orange-700">
            الوقت المتبقي لأقرب عرض: {referenceDate ? formatCountdown(getSecondsLeft(nearestExpiry, referenceDate)) : "00:00:00"}
          </p>
        ) : null}
        <div className="inner-page__actions">
          <Link className="hero-btn hero-btn--primary" href="/store">
            تسوق من المتجر
          </Link>
          <Link className="hero-btn hero-btn--secondary" href="/categories">
            تصفح الفئات
          </Link>
        </div>
      </section>

      <section className="info-strip" aria-label="مؤشرات العروض">
        <article className="info-strip__card">
          <p className="info-strip__value">حتى 35%</p>
          <p className="info-strip__label">خصومات مباشرة</p>
        </article>
        <article className="info-strip__card">
          <p className="info-strip__value">{offers.length}</p>
          <p className="info-strip__label">دورة تحديث العروض</p>
        </article>
        <article className="info-strip__card">
          <p className="info-strip__value">فوري</p>
          <p className="info-strip__label">تفعيل العرض بالسلة</p>
        </article>
      </section>

      <section className="mt-4 grid gap-3 sm:grid-cols-3">
        <article className="offer-card">
          <h2 className="offer-card__title">الوقت المتبقي</h2>
          <p className="offer-card__desc">العداد حيّ ويتم تحديثه كل ثانية حتى انتهاء كل عرض.</p>
        </article>
        <article className="offer-card">
          <h2 className="offer-card__title">خصومات فورية</h2>
          <p className="offer-card__desc">الخصم يطبق تلقائيًا في صفحة الدفع حسب شروط كل عرض.</p>
        </article>
        <article className="offer-card">
          <h2 className="offer-card__title">دعم سريع</h2>
          <p className="offer-card__desc">إذا احتجتِ مساعدة في اختيار العرض، فريق الدعم متاح يوميًا.</p>
        </article>
      </section>

      <section className="offer-list" aria-label="قائمة العروض">
        {offers.map((offer) => (
          <article key={offer.id} className="offer-card">
            <h2 className="offer-card__title">{offer.title} • {offer.badge}</h2>
            <p className="offer-card__desc">{offer.details}</p>
            <p className="text-xs font-black text-orange-700">
              ينتهي خلال: {referenceDate ? formatCountdown(getSecondsLeft(offer.expiresAt, referenceDate)) : "00:00:00"}
            </p>
            {offer.couponCode ? (
              <p className="mt-2 rounded-xl border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-black text-zinc-700">
                الكوبون: {offer.couponCode}
              </p>
            ) : null}
            <div className="offer-card__actions">
              <Link className="offer-card__link" href={offer.href}>
                تطبيق العرض الآن
              </Link>
              <Link className="offer-card__link offer-card__link--ghost" href="/contact">
                احجزي عبر الدعم
              </Link>
            </div>
          </article>
        ))}
      </section>

      <section className="mt-4 rounded-2xl border border-orange-200 bg-orange-50 p-4">
        <h2 className="text-lg font-black text-zinc-900">كيف يطبق العرض تلقائيًا؟</h2>
        <p className="mt-2 text-sm text-zinc-700">
          عند إضافة المنتجات للسلة والانتقال إلى صفحة الدفع، يتم فحص الشروط (الفئة، الحد الأدنى، الشحن المجاني)
          وتطبيق أفضل عرض تلقائيًا. {activeCoupons.length > 0 ? `الكوبونات النشطة حاليًا: ${activeCoupons.join(" - ")}.` : "لا توجد كوبونات مفعلة حاليًا."}
        </p>
      </section>
    </main>
  );
}
