"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getAdminOrders, getDashboardSettings } from "@/lib/admin-storage";
import { useHydrated } from "@/lib/use-hydrated";
import {
  getCustomerProfile,
  getLoyaltyPoints,
  getStorefrontEventName,
  getWishlistIds,
  saveCustomerProfile,
  type CustomerAddress,
  type CustomerProfile,
} from "@/lib/storefront-storage";
import { normalizeToEnglishDigits } from "@/lib/digits";

function normalizePhone(value: string) {
  return normalizeToEnglishDigits(value).replace(/\s+/g, "");
}

function formatPrice(price: number, currencySymbol: string) {
  return `${Math.round(price)} ${currencySymbol}`;
}

const EMPTY_PROFILE: CustomerProfile = {
  name: "",
  phone: "",
  city: "",
  preferredContact: "whatsapp",
  addresses: [],
};

export default function AccountPage() {
  const hydrated = useHydrated();
  const [profile, setProfile] = useState<CustomerProfile>(() => getCustomerProfile());
  const [loyaltyPoints, setLoyaltyPoints] = useState(() => getLoyaltyPoints());
  const [wishlistCount, setWishlistCount] = useState(0);
  const [addressDraft, setAddressDraft] = useState({ label: "المنزل", city: "", details: "", notes: "" });
  const [message, setMessage] = useState("");
  const [orders] = useState(() => getAdminOrders());
  const [currencySymbol] = useState(() => getDashboardSettings().currencySymbol);
  const visibleProfile = hydrated ? profile : EMPTY_PROFILE;
  const visibleLoyaltyPoints = hydrated ? loyaltyPoints : 0;
  const visibleWishlistCount = hydrated ? wishlistCount : 0;
  const visibleCurrencySymbol = hydrated ? currencySymbol : "ر.س";

  useEffect(() => {
    const sync = () => {
      setProfile(getCustomerProfile());
      setLoyaltyPoints(getLoyaltyPoints());
      setWishlistCount(getWishlistIds().length);
    };

    sync();
    window.addEventListener(getStorefrontEventName(), sync);
    return () => window.removeEventListener(getStorefrontEventName(), sync);
  }, []);

  const matchedOrders = useMemo(() => {
    const phone = normalizePhone(visibleProfile.phone);
    if (!phone) {
      return [];
    }

    return orders.filter((order) => normalizePhone(order.phone) === phone).slice(0, 8);
  }, [orders, visibleProfile.phone]);

  function persistProfile(next: CustomerProfile, success: string) {
    const saved = saveCustomerProfile(next);
    setProfile(saved);
    setMessage(success);
    window.setTimeout(() => setMessage(""), 1800);
  }

  function addAddress() {
    if (!addressDraft.city.trim() || !addressDraft.details.trim()) {
      setMessage("أكملي بيانات العنوان أولًا.");
      window.setTimeout(() => setMessage(""), 1800);
      return;
    }

    const nextAddress: CustomerAddress = {
      id: `ADDR-${Date.now()}`,
      label: addressDraft.label.trim() || "العنوان",
      city: addressDraft.city.trim(),
      details: addressDraft.details.trim(),
      notes: addressDraft.notes.trim() || undefined,
    };

    persistProfile({ ...profile, addresses: [nextAddress, ...profile.addresses] }, "تم حفظ العنوان.");
    setAddressDraft({ label: "المنزل", city: "", details: "", notes: "" });
  }

  function removeAddress(addressId: string) {
    persistProfile(
      { ...profile, addresses: profile.addresses.filter((address) => address.id !== addressId) },
      "تم حذف العنوان.",
    );
  }

  return (
    <main className="inner-page site-shell" dir="rtl">
      <section className="inner-page__hero">
        <p className="inner-page__kicker">حسابي</p>
        <h1 className="inner-page__title">ملفك وبياناتك السريعة</h1>
        <p className="inner-page__desc">احفظي الاسم والجوال والعناوين لتجربة أسرع في الطلبات القادمة ومتابعة نشاطك من مكان واحد.</p>
      </section>

      <section className="info-strip" aria-label="ملخص الحساب">
        <article className="info-strip__card">
          <p className="info-strip__value">{visibleLoyaltyPoints}</p>
          <p className="info-strip__label">نقطة ولاء</p>
        </article>
        <article className="info-strip__card">
          <p className="info-strip__value">{visibleWishlistCount}</p>
          <p className="info-strip__label">في المفضلة</p>
        </article>
        <article className="info-strip__card">
          <p className="info-strip__value">{matchedOrders.length}</p>
          <p className="info-strip__label">طلبات مطابقة</p>
        </article>
      </section>

      {message ? <p className="admin-notice mt-4">{message}</p> : null}

      <section className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="product-detail-card">
          <h2>بياناتك الأساسية</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <input className="form-input" type="text" placeholder="الاسم" value={visibleProfile.name} onChange={(event) => setProfile((prev) => ({ ...prev, name: event.target.value }))} />
            <input className="form-input" type="tel" placeholder="رقم الجوال" value={visibleProfile.phone} onChange={(event) => setProfile((prev) => ({ ...prev, phone: normalizeToEnglishDigits(event.target.value) }))} />
            <input className="form-input" type="text" placeholder="المدينة الافتراضية" value={visibleProfile.city} onChange={(event) => setProfile((prev) => ({ ...prev, city: event.target.value }))} />
            <select className="form-input" value={visibleProfile.preferredContact} onChange={(event) => setProfile((prev) => ({ ...prev, preferredContact: event.target.value as "whatsapp" | "phone" }))}>
              <option value="whatsapp">واتساب</option>
              <option value="phone">اتصال</option>
            </select>
          </div>
          <div className="inner-page__actions mt-4">
            <button className="hero-btn hero-btn--primary" type="button" onClick={() => persistProfile(profile, "تم حفظ بيانات الحساب.")}>حفظ البيانات</button>
            <Link className="hero-btn hero-btn--secondary" href="/track-order">تتبع طلب</Link>
          </div>
        </article>

        <article className="product-detail-card">
          <h2>إضافة عنوان محفوظ</h2>
          <div className="mt-3 grid gap-2">
            <input className="form-input" type="text" placeholder="اسم العنوان: المنزل / العمل" value={addressDraft.label} onChange={(event) => setAddressDraft((prev) => ({ ...prev, label: event.target.value }))} />
            <input className="form-input" type="text" placeholder="المدينة" value={addressDraft.city} onChange={(event) => setAddressDraft((prev) => ({ ...prev, city: event.target.value }))} />
            <textarea className="form-input" rows={3} placeholder="تفاصيل العنوان" value={addressDraft.details} onChange={(event) => setAddressDraft((prev) => ({ ...prev, details: event.target.value }))} />
            <input className="form-input" type="text" placeholder="ملاحظات إضافية" value={addressDraft.notes} onChange={(event) => setAddressDraft((prev) => ({ ...prev, notes: event.target.value }))} />
            <button className="hero-btn hero-btn--secondary" type="button" onClick={addAddress}>حفظ العنوان</button>
          </div>
        </article>
      </section>

      <section className="product-detail-card mt-4">
        <h2>العناوين المحفوظة</h2>
        {visibleProfile.addresses.length === 0 ? (
          <p className="admin-muted mt-3">لا توجد عناوين محفوظة بعد.</p>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {visibleProfile.addresses.map((address) => (
              <article key={address.id} className="rounded-2xl border border-zinc-200 bg-white p-4">
                <p className="text-sm font-black text-zinc-900">{address.label}</p>
                <p className="mt-2 text-sm text-zinc-700">{address.city}</p>
                <p className="mt-1 text-sm text-zinc-600">{address.details}</p>
                {address.notes ? <p className="mt-1 text-xs text-zinc-500">{address.notes}</p> : null}
                <button className="mini-link mt-3" type="button" onClick={() => removeAddress(address.id)}>حذف</button>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="product-detail-card mt-4">
        <h2>طلباتي المرتبطة بجوالي</h2>
        {matchedOrders.length === 0 ? (
          <p className="admin-muted mt-3">بعد حفظ نفس رقم الجوال المستخدم في الطلبات ستظهر لك هنا أحدث الطلبات.</p>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {matchedOrders.map((order) => (
              <article key={order.id} className="rounded-2xl border border-zinc-200 bg-white p-4">
                <p className="text-sm font-black text-zinc-900">{order.id}</p>
                <p className="mt-1 text-xs text-zinc-600">{order.city}</p>
                <p className="mt-2 text-xs font-black text-orange-700">{formatPrice(order.total, visibleCurrencySymbol)}</p>
                <Link className="mini-link mt-3" href="/track-order">تتبع الطلب</Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}