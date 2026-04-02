"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import AddToCartButton from "@/components/add-to-cart-button";
import { PRODUCTS, getProductById } from "@/data/products";
import { getAdminProducts, type AdminProduct } from "@/lib/admin-storage";

const REVIEWS_BY_PRODUCT: Record<string, { author: string; rating: number; comment: string; date: string }[]> = {
  "vitamin-c-serum": [
    { author: "نورة", rating: 5, comment: "أعطى بشرتي إشراقة واضحة خلال أسبوعين.", date: "2026-03-21" },
    { author: "لجين", rating: 4.8, comment: "خفيف جدًا ويمتص بسرعة.", date: "2026-03-15" },
  ],
  "intense-hair-mask": [
    { author: "ريم", rating: 4.9, comment: "أفضل ماسك استخدمته للشعر الجاف.", date: "2026-03-28" },
    { author: "دانا", rating: 4.7, comment: "النتيجة ممتازة من أول مرة.", date: "2026-03-12" },
  ],
};

function formatPrice(price: number) {
  return `${price} ر.س`;
}

export default function ProductDetailsPage() {
  const params = useParams<{ productId: string }>();
  const productId = params?.productId || "";
  const product = getProductById(productId);
  const [adminProducts] = useState<AdminProduct[]>(() =>
    typeof window === "undefined" ? [] : getAdminProducts(),
  );

  const inventory = adminProducts.find((item) => item.id === productId);
  const stock = inventory?.stock ?? 0;

  const relatedProducts = useMemo(
    () =>
      PRODUCTS.filter((item) => item.category === product?.category && item.id !== product?.id)
        .slice(0, 3),
    [product],
  );

  const reviews = REVIEWS_BY_PRODUCT[productId] || [
    { author: "عميلة موثقة", rating: product?.rating || 4.7, comment: "جودة ممتازة وسرعة وصول عالية.", date: "2026-03-18" },
  ];

  if (!product) {
    return (
      <main className="inner-page site-shell" dir="rtl">
        <section className="checkout-empty">
          <h2>المنتج غير موجود</h2>
          <p>قد يكون الرابط غير صحيح أو تم إيقاف المنتج.</p>
          <Link className="hero-btn hero-btn--primary" href="/store">
            العودة للمتجر
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="inner-page site-shell" dir="rtl">
      <section className="product-detail-hero">
        <div className="product-detail__image-wrap">
          <Image
            src={product.imagePath}
            alt={product.imageAlt}
            width={1000}
            height={680}
            sizes="(max-width: 768px) 100vw, 70vw"
            className="product-detail__image"
            priority
          />
        </div>
        <p className="inner-page__kicker">تفاصيل المنتج</p>
        <h1 className="product-detail__title">{product.name}</h1>
        <p className="product-detail__meta">
          {product.categoryLabel} • تقييم {product.rating} من 5
        </p>
        <p className="mt-2 text-sm font-black text-zinc-700">
          الحالة: {stock > 0 ? `متوفر (${stock} قطعة)` : "غير متوفر حاليًا"}
        </p>
        <p className="product-detail__desc">{product.shortDescription}</p>
        <div className="product-detail__price-row">
          <span className="product-detail__badge">{product.badge}</span>
          <strong className="product-detail__price">{formatPrice(product.price)}</strong>
        </div>
        <div className="inner-page__actions">
          {stock > 0 ? <AddToCartButton className="hero-btn hero-btn--primary" productId={product.id} /> : null}
          <Link className="hero-btn hero-btn--secondary" href="/checkout">
            اذهبي إلى الدفع
          </Link>
          <Link className="hero-btn hero-btn--secondary" href="/store">
            العودة للمتجر
          </Link>
        </div>
      </section>

      <section className="product-detail-card">
        <h2>مميزات المنتج</h2>
        <ul>
          {product.benefits.map((benefit) => (
            <li key={benefit}>{benefit}</li>
          ))}
        </ul>
      </section>

      <section className="product-detail-card mt-4">
        <h2>مراجعات العملاء</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {reviews.map((review, index) => (
            <article key={`${review.author}-${index}`} className="rounded-2xl border border-zinc-200 bg-white p-4">
              <p className="text-sm font-black text-zinc-900">{review.author}</p>
              <p className="text-xs font-bold text-orange-700">{review.rating} / 5</p>
              <p className="mt-2 text-sm text-zinc-700">{review.comment}</p>
              <p className="mt-2 text-xs text-zinc-500">{review.date}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="product-detail-card mt-4">
        <h2>منتجات مشابهة</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {relatedProducts.map((item) => (
            <article key={item.id} className="rounded-2xl border border-zinc-200 bg-white p-4">
              <p className="text-sm font-black text-zinc-900">{item.name}</p>
              <p className="mt-2 text-xs text-zinc-600">{item.shortDescription}</p>
              <p className="mt-2 text-xs font-black text-orange-700">{formatPrice(item.price)}</p>
              <Link className="mini-link mt-3" href={`/store/${item.id}`}>
                فتح المنتج
              </Link>
            </article>
          ))}
        </div>
      </section>

      <div className="inner-page__actions">
        <Link className="hero-btn hero-btn--secondary" href={`/contact?product=${product.id}`}>
          اسألي عن هذا المنتج
        </Link>
      </div>
    </main>
  );
}
