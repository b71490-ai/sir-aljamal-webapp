"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import AddToCartButton from "@/components/add-to-cart-button";
import WishlistToggle from "@/components/wishlist-toggle";
import { getAdminProducts, getDashboardSettings, type AdminProduct } from "@/lib/admin-storage";
import {
  addProductReview,
  getProductReviews,
  getRecentlyViewedProductIds,
  pushRecentlyViewedProduct,
  type ProductReview,
} from "@/lib/storefront-storage";

type ProductDetailsViewProps = {
  productId: string;
};

const DEFAULT_REVIEWS_BY_PRODUCT: Record<string, ProductReview[]> = {
  "vitamin-c-serum": [
    { id: "seed-1", author: "نورة", rating: 5, comment: "أعطى بشرتي إشراقة واضحة خلال أسبوعين.", date: "2026-03-21" },
    { id: "seed-2", author: "لجين", rating: 4.8, comment: "خفيف جدًا ويمتص بسرعة.", date: "2026-03-15" },
  ],
  "intense-hair-mask": [
    { id: "seed-3", author: "ريم", rating: 4.9, comment: "أفضل ماسك استخدمته للشعر الجاف.", date: "2026-03-28" },
    { id: "seed-4", author: "دانا", rating: 4.7, comment: "النتيجة ممتازة من أول مرة.", date: "2026-03-12" },
  ],
};

function formatPrice(price: number, currencySymbol: string) {
  return `${price} ${currencySymbol}`;
}

export default function ProductDetailsView({ productId }: ProductDetailsViewProps) {
  const [adminProducts] = useState<AdminProduct[]>(() =>
    typeof window === "undefined" ? [] : getAdminProducts(),
  );
  const [selectedImage, setSelectedImage] = useState("");
  const [reviews, setReviews] = useState<ProductReview[]>(() => {
    if (typeof window === "undefined") {
      return [...(DEFAULT_REVIEWS_BY_PRODUCT[productId] || [])];
    }

    const stored = getProductReviews(productId);
    return [...(stored.length > 0 ? stored : []), ...(DEFAULT_REVIEWS_BY_PRODUCT[productId] || [])];
  });
  const [reviewAuthor, setReviewAuthor] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewRating, setReviewRating] = useState("5");
  const [reviewMessage, setReviewMessage] = useState("");
  const [currencySymbol] = useState(() => (typeof window === "undefined" ? "ر.س" : getDashboardSettings().currencySymbol));

  const displayProduct = adminProducts.find((item) => item.id === productId) || null;

  const gallery = useMemo(() => {
    const images = displayProduct?.imageGallery || [];
    return images.length > 0 ? images : displayProduct ? [displayProduct.imagePath] : [];
  }, [displayProduct]);

  useEffect(() => {
    if (!displayProduct) {
      return;
    }
    pushRecentlyViewedProduct(displayProduct.id);
  }, [displayProduct]);

  const stock = displayProduct?.stock ?? 0;

  const relatedProducts = useMemo(
    () =>
      adminProducts
        .filter((item) => item.category === displayProduct?.category && item.id !== displayProduct?.id && item.isActive)
        .slice(0, 3),
    [adminProducts, displayProduct],
  );

  const recentlyViewed = useMemo(() => {
    if (!displayProduct) {
      return [];
    }

    const ids = getRecentlyViewedProductIds();
    return adminProducts.filter((item) => ids.includes(item.id) && item.id !== displayProduct.id).slice(0, 4);
  }, [adminProducts, displayProduct]);

  function handleReviewSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!displayProduct) {
      return;
    }
    if (!reviewAuthor.trim() || !reviewComment.trim()) {
      setReviewMessage("اكتبي الاسم والتعليق أولًا.");
      return;
    }

    const review = addProductReview(displayProduct.id, {
      author: reviewAuthor.trim(),
      comment: reviewComment.trim(),
      rating: Math.max(1, Math.min(5, Number(reviewRating) || 5)),
    });

    setReviews((prev) => [review, ...prev]);
    setReviewAuthor("");
    setReviewComment("");
    setReviewRating("5");
    setReviewMessage("تم إرسال المراجعة بنجاح.");
  }

  if (!displayProduct) {
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
            src={selectedImage || gallery[0] || displayProduct.imagePath}
            alt={displayProduct.imageAlt}
            width={1000}
            height={680}
            sizes="(max-width: 768px) 100vw, 70vw"
            className="product-detail__image"
            priority
          />
        </div>
        {gallery.length > 1 ? (
          <div className="product-gallery-thumbs" aria-label="صور المنتج">
            {gallery.map((imagePath, index) => (
              <button
                key={`${imagePath}-${index}`}
                type="button"
                className={`product-gallery-thumb ${(selectedImage || gallery[0]) === imagePath ? "is-active" : ""}`}
                onClick={() => setSelectedImage(imagePath)}
              >
                <Image
                  src={imagePath}
                  alt={`${displayProduct.imageAlt} ${index + 1}`}
                  width={160}
                  height={120}
                  className="product-gallery-thumb__image"
                />
              </button>
            ))}
          </div>
        ) : null}
        <p className="inner-page__kicker">تفاصيل المنتج</p>
        <h1 className="product-detail__title">{displayProduct.name}</h1>
        <p className="product-detail__meta">
          {displayProduct.categoryLabel} • تقييم {displayProduct.rating} من 5
        </p>
        <p className="mt-2 text-sm font-black text-zinc-700">
          الحالة: {stock > 0 ? `متوفر (${stock} قطعة)` : "غير متوفر حاليًا"}
        </p>
        <p className="product-detail__desc">{displayProduct.shortDescription}</p>
        <div className="product-detail__price-row">
          <span className="product-detail__badge">{displayProduct.badge}</span>
          <strong className="product-detail__price">{formatPrice(displayProduct.price, currencySymbol)}</strong>
        </div>
        <div className="inner-page__actions">
          {stock > 0 ? <AddToCartButton className="hero-btn hero-btn--primary" productId={displayProduct.id} /> : null}
          <WishlistToggle className="hero-btn hero-btn--secondary" productId={displayProduct.id} />
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
          {displayProduct.benefits.map((benefit) => (
            <li key={benefit}>{benefit}</li>
          ))}
        </ul>
      </section>

      <section className="product-detail-card mt-4">
        <h2>مراجعات العملاء</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {reviews.map((review) => (
            <article key={review.id} className="rounded-2xl border border-zinc-200 bg-white p-4">
              <p className="text-sm font-black text-zinc-900">{review.author}</p>
              <p className="text-xs font-bold text-orange-700">{review.rating} / 5</p>
              <p className="mt-2 text-sm text-zinc-700">{review.comment}</p>
              <p className="mt-2 text-xs text-zinc-500">{review.date}</p>
            </article>
          ))}
        </div>
        <form className="mt-4 grid gap-2 md:grid-cols-2" onSubmit={handleReviewSubmit}>
          {reviewMessage ? <p className="md:col-span-2 text-sm font-black text-green-700">{reviewMessage}</p> : null}
          <input className="form-input" type="text" placeholder="اسمك" value={reviewAuthor} onChange={(event) => setReviewAuthor(event.target.value)} />
          <select className="form-input" value={reviewRating} onChange={(event) => setReviewRating(event.target.value)}>
            <option value="5">5 نجوم</option>
            <option value="4">4 نجوم</option>
            <option value="3">3 نجوم</option>
            <option value="2">2 نجمتان</option>
            <option value="1">1 نجمة</option>
          </select>
          <textarea className="form-input md:col-span-2" rows={4} placeholder="اكتبي رأيك في المنتج" value={reviewComment} onChange={(event) => setReviewComment(event.target.value)} />
          <button className="hero-btn hero-btn--primary md:col-span-2" type="submit">إرسال المراجعة</button>
        </form>
      </section>

      <section className="product-detail-card mt-4">
        <h2>منتجات مشابهة</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {relatedProducts.map((item) => (
            <article key={item.id} className="rounded-2xl border border-zinc-200 bg-white p-4">
              <p className="text-sm font-black text-zinc-900">{item.name}</p>
              <p className="mt-2 text-xs text-zinc-600">{item.shortDescription}</p>
              <p className="mt-2 text-xs font-black text-orange-700">{formatPrice(item.price, currencySymbol)}</p>
              <Link className="mini-link mt-3" href={`/store/${item.id}`}>فتح المنتج</Link>
            </article>
          ))}
        </div>
      </section>

      {recentlyViewed.length > 0 ? (
        <section className="product-detail-card mt-4">
          <h2>شوهد مؤخرًا</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {recentlyViewed.map((item) => (
              <article key={item.id} className="rounded-2xl border border-zinc-200 bg-white p-4">
                <p className="text-sm font-black text-zinc-900">{item.name}</p>
                <p className="mt-2 text-xs text-zinc-600">{item.categoryLabel}</p>
                <Link className="mini-link mt-3" href={`/store/${item.id}`}>العودة للمنتج</Link>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <div className="inner-page__actions">
        <Link className="hero-btn hero-btn--secondary" href={`/contact?product=${displayProduct.id}`}>
          اسألي عن هذا المنتج
        </Link>
      </div>
    </main>
  );
}
