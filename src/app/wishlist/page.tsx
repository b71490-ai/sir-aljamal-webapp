"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AddToCartButton from "@/components/add-to-cart-button";
import WishlistToggle from "@/components/wishlist-toggle";
import type { AdminProduct } from "@/lib/admin-storage";
import { useHydrated } from "@/lib/use-hydrated";
import { useStorefrontPublicState } from "@/lib/use-storefront-public-state";
import {
  getRecentlyViewedProductIds,
  getStorefrontEventName,
  getWishlistIds,
} from "@/lib/storefront-storage";

function formatPrice(price: number, currencySymbol: string) {
  return `${price} ${currencySymbol}`;
}

export default function WishlistPage() {
  const hydrated = useHydrated();
  const storefrontState = useStorefrontPublicState();
  const products: AdminProduct[] = storefrontState.products;
  const currencySymbol = hydrated ? storefrontState.settings.currencySymbol : "ر.س";
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [recentIds, setRecentIds] = useState<string[]>([]);

  useEffect(() => {
    const sync = () => {
      setWishlistIds(getWishlistIds());
      setRecentIds(getRecentlyViewedProductIds());
    };

    sync();
    window.addEventListener(getStorefrontEventName(), sync);
    return () => window.removeEventListener(getStorefrontEventName(), sync);
  }, []);

  const wishlistProducts = useMemo(
    () => (hydrated ? wishlistIds : []).map((id) => products.find((product) => product.id === id)).filter((product): product is AdminProduct => Boolean(product)),
    [hydrated, products, wishlistIds],
  );

  const recentlyViewedProducts = useMemo(
    () => (hydrated ? recentIds : [])
      .map((id) => products.find((product) => product.id === id))
      .filter((product): product is AdminProduct => Boolean(product))
      .filter((product) => !wishlistIds.includes(product.id))
      .slice(0, 6),
    [hydrated, products, recentIds, wishlistIds],
  );

  return (
    <main className="inner-page site-shell" dir="rtl">
      <section className="inner-page__hero">
        <p className="inner-page__kicker">المفضلة</p>
        <h1 className="inner-page__title">منتجاتك المحفوظة للرجوع السريع</h1>
        <p className="inner-page__desc">احتفظي بما أعجبك في رف واحد، وارجعي أيضًا لما شاهدته مؤخرًا بدون بحث جديد.</p>
        <div className="inner-page__actions">
          <Link className="hero-btn hero-btn--primary" href="/store">
            متابعة التسوق
          </Link>
          <Link className="hero-btn hero-btn--secondary" href="/track-order">
            تتبع الطلب
          </Link>
        </div>
      </section>

      <section className="info-strip" aria-label="ملخص المفضلة">
        <article className="info-strip__card">
          <p className="info-strip__value">{wishlistProducts.length}</p>
          <p className="info-strip__label">منتجات محفوظة</p>
        </article>
        <article className="info-strip__card">
          <p className="info-strip__value">{recentlyViewedProducts.length}</p>
          <p className="info-strip__label">شوهدت مؤخرًا</p>
        </article>
        <article className="info-strip__card">
          <p className="info-strip__value">سريع</p>
          <p className="info-strip__label">وصول للمنتج</p>
        </article>
      </section>

      <section className="mt-4">
        <div className="section-head mb-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-600">رفك الشخصي</p>
            <h2 className="mt-1 text-xl font-black text-zinc-900 sm:text-2xl">المفضلة</h2>
          </div>
        </div>

        {wishlistProducts.length === 0 ? (
          <section className="checkout-empty">
            <h2>لا توجد منتجات في المفضلة بعد</h2>
            <p>استخدمي زر المفضلة داخل المتجر أو صفحة المنتج لحفظ ما يعجبك هنا.</p>
            <Link className="hero-btn hero-btn--primary" href="/store">
              ابدئي من المتجر
            </Link>
          </section>
        ) : (
          <div className="product-grid">
            {wishlistProducts.map((product) => {
              const cardImage = product.imageGallery?.[0] || product.imagePath;

              return (
                <article key={product.id} className="product-card">
                  <div className="product-card__image-wrap">
                    <Image
                      src={cardImage}
                      alt={product.imageAlt}
                      width={520}
                      height={380}
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="product-card__image"
                    />
                  </div>
                  <span className="product-card__badge">{product.badge}</span>
                  <h2 className="product-card__name">{product.name}</h2>
                  <p className="product-card__category">{product.categoryLabel}</p>
                  <p className="mt-2 text-xs font-bold text-zinc-600">{product.shortDescription}</p>
                  <div className="product-card__foot">
                    <p className="product-card__price">{formatPrice(product.price, currencySymbol)}</p>
                    <div className="product-card__actions">
                      {product.stock > 0 ? <AddToCartButton className="product-card__cta" productId={product.id} /> : null}
                      <WishlistToggle className="product-card__cta product-card__cta--ghost" productId={product.id} />
                      <Link className="product-card__cta product-card__cta--ghost" href={`/store/${product.id}`}>
                        التفاصيل
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {recentlyViewedProducts.length > 0 ? (
        <section className="mt-6">
          <div className="section-head mb-3 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-600">عودة سريعة</p>
              <h2 className="mt-1 text-xl font-black text-zinc-900 sm:text-2xl">شوهد مؤخرًا</h2>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recentlyViewedProducts.map((product) => (
              <article key={product.id} className="feature-card feature-card--light">
                <p className="text-sm font-black text-zinc-900">{product.name}</p>
                <p className="mt-2 text-sm text-zinc-700">{product.shortDescription}</p>
                <p className="mt-2 text-xs font-black text-orange-700">{formatPrice(product.price, currencySymbol)}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link className="mini-link" href={`/store/${product.id}`}>
                    فتح المنتج
                  </Link>
                  <WishlistToggle productId={product.id} className="mini-link" />
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}