"use client";

import { useState } from "react";
import Link from "next/link";
import { getProductById } from "@/data/products";
import { useCart } from "@/components/cart-provider";
import { addAdminOrder, getDashboardSettings } from "@/lib/admin-storage";
import { calculateAutoOfferDiscount, findCouponOffer } from "@/data/offers";
import { pushAdminStateToServer } from "@/lib/admin-sync";

function formatPrice(price: number) {
  return `${price} ر.س`;
}

const SHIPPING_METHODS = {
  express: { label: "شحن سريع (4-24 ساعة)", fee: 25, allowedCities: ["الرياض", "جدة", "الدمام", "الخبر", "مكة"] },
  standard: { label: "شحن قياسي (1-3 أيام)", fee: 15, allowedCities: [] as string[] },
  pickup: { label: "استلام من الفرع", fee: 0, allowedCities: ["الرياض"] },
} as const;

type ShippingKey = keyof typeof SHIPPING_METHODS;

function isValidPhone(value: string) {
  const normalized = value.replace(/\s+/g, "");
  return /^(\+966|966|0)?5\d{8}$/.test(normalized);
}

function isValidCity(value: string) {
  return /^[\u0600-\u06FFa-zA-Z\s]{2,30}$/.test(value.trim());
}

export default function CheckoutView() {
  const { items, subtotal, totalItems, updateQuantity, removeFromCart, clearCart } = useCart();
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [notes, setNotes] = useState("");
  const [shippingMethod, setShippingMethod] = useState<ShippingKey>("express");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCouponCode, setAppliedCouponCode] = useState("");
  const [formError, setFormError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [whatsappNumber] = useState(() => getDashboardSettings().whatsappNumber);

  const populatedItems = items
    .map((item) => {
      const product = getProductById(item.productId);
      if (!product) {
        return null;
      }
      return {
        ...item,
        product,
        lineTotal: item.quantity * product.price,
      };
    })
    .filter(
      (item): item is { productId: string; quantity: number; product: NonNullable<ReturnType<typeof getProductById>>; lineTotal: number } =>
        item !== null,
    );

  const offerLines = populatedItems.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
    unitPrice: item.product.price,
    category: item.product.category,
  }));

  const autoOfferResult = calculateAutoOfferDiscount(offerLines, subtotal);

  const matchedCouponOffer = appliedCouponCode ? findCouponOffer(appliedCouponCode) : null;
  const couponAllowed = matchedCouponOffer
    ? subtotal >= (matchedCouponOffer.rule.minSubtotal || 0)
    : false;
  const couponDiscount = matchedCouponOffer && couponAllowed
    ? Math.round(subtotal * ((matchedCouponOffer.discountPercent || 0) / 100))
    : 0;

  const selectedShipping = SHIPPING_METHODS[shippingMethod];
  const isShippingAllowed =
    selectedShipping.allowedCities.length === 0 ||
    selectedShipping.allowedCities.some((allowedCity) => city.includes(allowedCity));
  const shippingFeeBase = populatedItems.length > 0 ? selectedShipping.fee : 0;
  const shippingFee = autoOfferResult.freeShipping ? 0 : shippingFeeBase;

  const discountsTotal = autoOfferResult.discount + couponDiscount;
  const total = Math.max(0, subtotal - discountsTotal + shippingFee);

  const orderMessage = populatedItems
    .map(
      (item) =>
        `- ${item.product.name} x${item.quantity} = ${item.lineTotal} ر.س`,
    )
    .join("\n");

  const customerBlock = [
    customerName ? `الاسم: ${customerName}` : null,
    phone ? `الجوال: ${phone}` : null,
    city ? `المدينة: ${city}` : null,
    notes ? `ملاحظات: ${notes}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    `مرحبًا، أريد تأكيد الطلب:\n${orderMessage}\n${customerBlock}\nطريقة الشحن: ${selectedShipping.label}\nالمجموع الفرعي: ${subtotal} ر.س\nخصومات: ${discountsTotal} ر.س\nالشحن: ${shippingFee} ر.س\nالإجمالي: ${total} ر.س`,
  )}`;

  function applyCoupon() {
    const normalized = couponCode.trim().toUpperCase();
    const offer = findCouponOffer(normalized);
    if (!offer) {
      setFormError("الكوبون غير صالح أو منتهي.");
      setAppliedCouponCode("");
      return;
    }
    if (subtotal < (offer.rule.minSubtotal || 0)) {
      setFormError(`الكوبون يتطلب حد أدنى ${(offer.rule.minSubtotal || 0).toString()} ر.س.`);
      setAppliedCouponCode("");
      return;
    }
    setFormError("");
    setAppliedCouponCode(normalized);
  }

  function handleConfirmOrder() {
    if (!customerName.trim()) {
      setFormError("يرجى إدخال الاسم الكامل.");
      return;
    }
    if (!isValidPhone(phone)) {
      setFormError("رقم الجوال غير صحيح. مثال: 05XXXXXXXX");
      return;
    }
    if (!isValidCity(city)) {
      setFormError("المدينة غير صحيحة. استخدمي اسم مدينة واضح.");
      return;
    }
    if (!isShippingAllowed) {
      setFormError("طريقة الشحن المختارة غير متاحة لهذه المدينة.");
      return;
    }
    if (populatedItems.length === 0) {
      setFormError("لا يمكن إتمام الطلب وسلة الشراء فارغة.");
      return;
    }

    setFormError("");

    const order = addAdminOrder({
      customerName,
      phone,
      city,
      notes,
      source: "checkout",
      items: populatedItems.map((item) => ({
        productId: item.productId,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        lineTotal: item.lineTotal,
      })),
      subtotal,
      deliveryFee: shippingFee,
      total,
    });

    const trackingId = `TRK-${order.id.replace("ORD-", "")}`;
    setSuccessMessage(`تم إنشاء الطلب بنجاح. رقم الطلب: ${order.id} | رقم التتبع: ${trackingId}`);
    void pushAdminStateToServer();

    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    clearCart();
    setAppliedCouponCode("");
    setCouponCode("");
  }

  return (
    <>
      <section className="inner-page__hero">
        <p className="inner-page__kicker">الدفع</p>
        <h1 className="inner-page__title">إتمام الطلب</h1>
        <p className="inner-page__desc">
          راجعي المنتجات داخل السلة، عدلي الكميات، ثم أكملي الطلب مباشرة عبر واتساب.
        </p>
      </section>

      {populatedItems.length === 0 ? (
        <section className="checkout-empty">
          <h2>سلتك فارغة حاليًا</h2>
          <p>أضيفي منتجات من المتجر للمتابعة إلى صفحة الدفع.</p>
          <Link className="hero-btn hero-btn--primary" href="/store">
            اذهب إلى المتجر
          </Link>
        </section>
      ) : (
        <section className="checkout-layout">
          <div className="checkout-items">
            {populatedItems.map((item) => (
              <article key={item.productId} className="checkout-item">
                <div>
                  <p className="checkout-item__name">{item.product.name}</p>
                  <p className="checkout-item__meta">{item.product.categoryLabel}</p>
                </div>
                <div className="checkout-item__controls">
                  <button
                    className="qty-btn"
                    type="button"
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                  >
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    className="qty-btn"
                    type="button"
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                  >
                    +
                  </button>
                </div>
                <p className="checkout-item__price">{formatPrice(item.lineTotal)}</p>
                <button
                  className="mini-link"
                  type="button"
                  onClick={() => removeFromCart(item.productId)}
                >
                  إزالة
                </button>
              </article>
            ))}
          </div>

          <aside className="checkout-summary">
            <p>عدد القطع: {totalItems}</p>
            <p>المجموع الفرعي: {formatPrice(subtotal)}</p>
            <p>خصم تلقائي: {formatPrice(autoOfferResult.discount)}</p>
            <p>خصم كوبون: {formatPrice(couponDiscount)}</p>
            <p>الشحن: {formatPrice(shippingFee)}</p>
            <p className="checkout-summary__total">الإجمالي: {formatPrice(total)}</p>
            {autoOfferResult.offer ? (
              <p className="text-xs font-bold text-green-700">تم تطبيق: {autoOfferResult.offer.title}</p>
            ) : null}
            {successMessage ? (
              <p className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm font-black text-green-800">
                {successMessage}
              </p>
            ) : null}
            {formError ? (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-black text-red-700">
                {formError}
              </p>
            ) : null}
            <div className="checkout-customer-form">
              <input
                className="form-input"
                type="text"
                placeholder="الاسم الكامل"
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                required
              />
              <input
                className="form-input"
                type="tel"
                placeholder="رقم الجوال"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                required
              />
              <input
                className="form-input"
                type="text"
                placeholder="المدينة"
                value={city}
                onChange={(event) => setCity(event.target.value)}
                required
              />
              <select
                className="form-input"
                value={shippingMethod}
                onChange={(event) => setShippingMethod(event.target.value as ShippingKey)}
              >
                {(Object.keys(SHIPPING_METHODS) as ShippingKey[]).map((methodKey) => (
                  <option key={methodKey} value={methodKey}>
                    {SHIPPING_METHODS[methodKey].label} - {formatPrice(SHIPPING_METHODS[methodKey].fee)}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <input
                  className="form-input"
                  type="text"
                  placeholder="كوبون خصم"
                  value={couponCode}
                  onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
                />
                <button className="hero-btn hero-btn--secondary" type="button" onClick={applyCoupon}>
                  تطبيق
                </button>
              </div>
              <textarea
                className="form-input"
                placeholder="ملاحظات التوصيل"
                rows={3}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </div>
            <button
              className="hero-btn hero-btn--primary"
              type="button"
              onClick={handleConfirmOrder}
              disabled={!customerName || !phone || !city}
            >
              تأكيد الطلب عبر واتساب
            </button>
            <button className="hero-btn hero-btn--secondary" type="button" onClick={clearCart}>
              تفريغ السلة
            </button>
          </aside>
        </section>
      )}
    </>
  );
}
