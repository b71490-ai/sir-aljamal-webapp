"use client";

import { useState, type ChangeEvent } from "react";
import Link from "next/link";
import { useCart } from "@/components/cart-provider";
import { addAdminOrder, getAdminProductById, getDashboardSettings } from "@/lib/admin-storage";
import { calculateAutoOfferDiscount, findCouponOffer } from "@/data/offers";
import { pushAdminStateToServer } from "@/lib/admin-sync";
import { addLoyaltyPoints, getCustomerProfile, saveCustomerProfile, type CustomerAddress } from "@/lib/storefront-storage";
import { normalizeToEnglishDigits } from "@/lib/digits";

function formatPrice(price: number, currencySymbol: string) {
  return `${price} ${currencySymbol}`;
}

const SHIPPING_METHODS = {
  express: { label: "توصيل مدن رئيسية في اليمن (خلال 24-48 ساعة)", fee: 800, allowedCities: ["صنعاء", "عدن", "تعز", "إب", "الحديدة", "المكلا"] },
  standard: { label: "شحن محافظات (1-3 أيام)", fee: 500, allowedCities: [] as string[] },
  pickup: { label: "استلام من نقطة التنسيق", fee: 0, allowedCities: ["صنعاء"] },
} as const;

type ShippingKey = keyof typeof SHIPPING_METHODS;

function isValidPhone(value: string) {
  const normalized = normalizeToEnglishDigits(value).replace(/\s+/g, "");
  return /^(\+?967|0)?7\d{8}$/.test(normalized);
}

function isValidCity(value: string) {
  return /^[\u0600-\u06FFa-zA-Z\s]{2,30}$/.test(value.trim());
}

function getInitialProfile() {
  if (typeof window === "undefined") {
    return {
      name: "",
      phone: "",
      city: "",
      addresses: [] as CustomerAddress[],
    };
  }

  const profile = getCustomerProfile();
  return {
    name: profile.name || "",
    phone: profile.phone || "",
    city: profile.city || "",
    addresses: profile.addresses || [],
  };
}

export default function CheckoutView() {
  const { items, subtotal, totalItems, updateQuantity, removeFromCart, clearCart } = useCart();
  const initialProfile = getInitialProfile();
  const [customerName, setCustomerName] = useState(initialProfile.name);
  const [phone, setPhone] = useState(initialProfile.phone);
  const [city, setCity] = useState(initialProfile.city);
  const [notes, setNotes] = useState("");
  const [shippingMethod, setShippingMethod] = useState<ShippingKey>("express");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCouponCode, setAppliedCouponCode] = useState("");
  const [savedAddresses] = useState<CustomerAddress[]>(initialProfile.addresses);
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentReceiptImage, setPaymentReceiptImage] = useState("");
  const [formError, setFormError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [settings] = useState(() => getDashboardSettings());
  const [whatsappNumber] = useState(() => getDashboardSettings().whatsappNumber);

  const availablePaymentMethods = settings.paymentMethods.filter((method) => method.isEnabled);
  const [paymentMethodId, setPaymentMethodId] = useState(() => availablePaymentMethods[0]?.id || "");
  const [payerName, setPayerName] = useState(initialProfile.name);
  const selectedPaymentMethod = availablePaymentMethods.find((method) => method.id === paymentMethodId) || availablePaymentMethods[0] || null;
  const currencySymbol = settings.currencySymbol;

  function applySavedAddress(addressId: string) {
    const address = savedAddresses.find((item) => item.id === addressId);
    if (!address) {
      return;
    }

    setCity(address.city);
    setNotes(address.notes ? `${address.details}\n${address.notes}` : address.details);
  }

  async function handleReceiptUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setFormError("يرجى اختيار صورة فقط كسند تحويل.");
      return;
    }

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("file_read_failed"));
      reader.readAsDataURL(file);
    });

    setPaymentReceiptImage(dataUrl);
    setFormError("");
  }

  const populatedItems = items
    .map((item) => {
      const product = getAdminProductById(item.productId);
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
      (item): item is { productId: string; quantity: number; product: NonNullable<ReturnType<typeof getAdminProductById>>; lineTotal: number } =>
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
        `- ${item.product.name} x${item.quantity} = ${formatPrice(item.lineTotal, currencySymbol)}`,
    )
    .join("\n");

  const customerBlock = [
    customerName ? `الاسم: ${customerName}` : null,
    phone ? `الجوال: ${phone}` : null,
    city ? `المدينة: ${city}` : null,
    selectedPaymentMethod ? `وسيلة الدفع: ${selectedPaymentMethod.name}` : null,
    payerName ? `اسم المحوّل: ${payerName}` : null,
    paymentReference ? `مرجع الحوالة: ${paymentReference}` : null,
    notes ? `ملاحظات: ${notes}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    `مرحبًا، أريد تأكيد الطلب:\n${orderMessage}\n${customerBlock}\nطريقة الشحن: ${selectedShipping.label}\nالمجموع الفرعي: ${formatPrice(subtotal, currencySymbol)}\nخصومات: ${formatPrice(discountsTotal, currencySymbol)}\nالشحن: ${formatPrice(shippingFee, currencySymbol)}\nالإجمالي: ${formatPrice(total, currencySymbol)}`,
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
      setFormError(`الكوبون يتطلب حد أدنى ${formatPrice(offer.rule.minSubtotal || 0, currencySymbol)}.`);
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
    if (!selectedPaymentMethod) {
      setFormError("لا توجد وسيلة دفع مفعلة حاليًا. فعّلي وسيلة من لوحة التحكم.");
      return;
    }
    if (!payerName.trim()) {
      setFormError("اكتبي اسم الشخص الذي قام بالتحويل.");
      return;
    }
    if (!paymentReference.trim()) {
      setFormError("أدخلي رقم العملية أو مرجع الحوالة.");
      return;
    }
    if (!paymentReceiptImage) {
      setFormError("أرفقي صورة سند التحويل قبل إرسال الطلب.");
      return;
    }

    setFormError("");

    const order = addAdminOrder({
      customerName,
      phone,
      city,
      notes,
      source: "checkout",
      paymentMethodId: selectedPaymentMethod.id,
      paymentMethodLabel: `${selectedPaymentMethod.name} - ${selectedPaymentMethod.accountNumber}`,
      paymentReference: paymentReference.trim(),
      payerName: payerName.trim(),
      paymentReceiptImage,
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
    const earnedPoints = Math.max(1, Math.round(total / 10));
    const nextPoints = addLoyaltyPoints(earnedPoints);
    saveCustomerProfile({
      ...getCustomerProfile(),
      name: customerName,
      phone,
      city,
    });
    setSuccessMessage(`تم إنشاء الطلب بنجاح بانتظار مراجعة الحوالة. رقم الطلب: ${order.id} | رقم التتبع: ${trackingId} | أضيف ${earnedPoints} نقطة إلى رصيدك وأصبح ${nextPoints} نقطة.`);
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
          اختاري وسيلة التحويل المناسبة في اليمن، أدخلي مرجع الحوالة، ثم أكملي الطلب للمراجعة والتأكيد.
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
                <p className="checkout-item__price">{formatPrice(item.lineTotal, currencySymbol)}</p>
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
            <p>المجموع الفرعي: {formatPrice(subtotal, currencySymbol)}</p>
            <p>خصم تلقائي: {formatPrice(autoOfferResult.discount, currencySymbol)}</p>
            <p>خصم كوبون: {formatPrice(couponDiscount, currencySymbol)}</p>
            <p>الشحن: {formatPrice(shippingFee, currencySymbol)}</p>
            <p className="checkout-summary__total">الإجمالي: {formatPrice(total, currencySymbol)}</p>
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
                onChange={(event) => setPhone(normalizeToEnglishDigits(event.target.value))}
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
              {savedAddresses.length > 0 ? (
                <select className="form-input" defaultValue="" onChange={(event) => applySavedAddress(event.target.value)}>
                  <option value="">اختاري عنوانًا محفوظًا</option>
                  {savedAddresses.map((address) => (
                    <option key={address.id} value={address.id}>
                      {address.label} - {address.city}
                    </option>
                  ))}
                </select>
              ) : null}
              <select
                className="form-input"
                value={shippingMethod}
                onChange={(event) => setShippingMethod(event.target.value as ShippingKey)}
              >
                {(Object.keys(SHIPPING_METHODS) as ShippingKey[]).map((methodKey) => (
                  <option key={methodKey} value={methodKey}>
                    {SHIPPING_METHODS[methodKey].label} - {formatPrice(SHIPPING_METHODS[methodKey].fee, currencySymbol)}
                  </option>
                ))}
              </select>
              <select className="form-input" value={paymentMethodId} onChange={(event) => setPaymentMethodId(event.target.value)}>
                {availablePaymentMethods.map((method) => (
                  <option key={method.id} value={method.id}>
                    {method.name} - {method.accountNumber}
                  </option>
                ))}
              </select>
              {selectedPaymentMethod ? (
                <div className="rounded-2xl border border-orange-200 bg-orange-50 px-3 py-3 text-sm text-zinc-800">
                  <p className="font-black text-zinc-900">{selectedPaymentMethod.provider}</p>
                  <p className="mt-1">اسم الحساب: {selectedPaymentMethod.accountName}</p>
                  <p className="mt-1">رقم الحساب/المحفظة: {selectedPaymentMethod.accountNumber}</p>
                  <p className="mt-2 text-xs font-bold text-orange-700">{selectedPaymentMethod.instructions}</p>
                </div>
              ) : null}
              <input
                className="form-input"
                type="text"
                placeholder="اسم المحوّل"
                value={payerName}
                onChange={(event) => setPayerName(event.target.value)}
              />
              <input
                className="form-input"
                type="text"
                placeholder="رقم العملية أو مرجع الحوالة"
                value={paymentReference}
                onChange={(event) => setPaymentReference(normalizeToEnglishDigits(event.target.value))}
              />
              <label className="hero-btn hero-btn--secondary">
                {paymentReceiptImage ? "تم إرفاق سند التحويل" : "إرفاق صورة سند التحويل"}
                <input className="admin-upload-dropzone__input" type="file" accept="image/*" onChange={(event) => void handleReceiptUpload(event)} />
              </label>
              {paymentReceiptImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={paymentReceiptImage} alt="سند التحويل" className="h-32 w-full rounded-2xl border border-orange-200 object-cover" />
              ) : null}
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
              إرسال طلب التحويل للمراجعة
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
