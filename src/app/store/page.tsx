"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import AddToCartButton from "@/components/add-to-cart-button";
import WishlistToggle from "@/components/wishlist-toggle";
import { CATEGORY_LABELS, type ProductCategory } from "@/data/products";
import type { AdminProduct } from "@/lib/admin-storage";
import { useStorefrontPublicState } from "@/lib/use-storefront-public-state";

const CATEGORY_KEYS = Object.keys(CATEGORY_LABELS) as ProductCategory[];
const PAGE_SIZE = 6;

function formatPrice(price: number, currencySymbol: string) {
  return `${price} ${currencySymbol}`;
}

export default function StorePage() {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | "all">("all");
  const [sortBy, setSortBy] = useState<"featured" | "price-asc" | "price-desc" | "rating" | "newest">("featured");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minRating, setMinRating] = useState("0");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const storefrontState = useStorefrontPublicState();
  const products: AdminProduct[] = storefrontState.products;
  const currencySymbol = storefrontState.settings.currencySymbol;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const categoryFromUrl = params.get("category");
    const queryFromUrl = params.get("query") || "";
    const nextCategory = CATEGORY_KEYS.includes(categoryFromUrl as ProductCategory)
      ? (categoryFromUrl as ProductCategory)
      : "all";

    setQuery(queryFromUrl);
    setSelectedCategory(nextCategory);
  }, []);

  const filteredProducts = useMemo(() => {
    const min = Number(minPrice) || 0;
    const max = Number(maxPrice) || Number.POSITIVE_INFINITY;
    const rating = Number(minRating) || 0;
    const normalizedQuery = query.trim().toLowerCase();

    const list = products.filter((product) => {
      if (!product.isActive) {
        return false;
      }
      if (selectedCategory !== "all" && product.category !== selectedCategory) {
        return false;
      }
      if (product.price < min || product.price > max) {
        return false;
      }
      if (product.rating < rating) {
        return false;
      }
      if (inStockOnly && product.stock <= 0) {
        return false;
      }
      if (!normalizedQuery) {
        return true;
      }

      return (
        product.name.toLowerCase().includes(normalizedQuery) ||
        product.shortDescription.toLowerCase().includes(normalizedQuery) ||
        product.badge.toLowerCase().includes(normalizedQuery)
      );
    });

    if (sortBy === "price-asc") {
      return [...list].sort((a, b) => a.price - b.price);
    }
    if (sortBy === "price-desc") {
      return [...list].sort((a, b) => b.price - a.price);
    }
    if (sortBy === "rating") {
      return [...list].sort((a, b) => b.rating - a.rating);
    }
    if (sortBy === "newest") {
      return [...list].sort((a, b) => Number(new Date(b.updatedAt)) - Number(new Date(a.updatedAt)));
    }

    return [...list].sort((a, b) => b.sales - a.sales);
  }, [products, minPrice, maxPrice, minRating, selectedCategory, inStockOnly, query, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedProducts = filteredProducts.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <main className="inner-page site-shell" dir="rtl">
      <section className="inner-page__hero">
        <p className="inner-page__kicker">أتيلية العطر</p>
        <h1 className="inner-page__title">متجر سر الجمال بطابع برفيوم فاخر</h1>
        <p className="inner-page__desc">
          تصفحي الرفوف بأسلوب أقرب لمتاجر العطور الراقية: ألوان أهدأ، إبراز أفضل للمنتج، وتجربة أنعم في البحث والاختيار.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs font-black text-zinc-700">
          <span className="trust-pill">نفحات شرقية</span>
          <span className="trust-pill">عروض بوتيك</span>
          <span className="trust-pill">تغليف فاخر</span>
          <span className="trust-pill">استشارة مباشرة</span>
        </div>
        <div className="inner-page__actions">
          <Link className="hero-btn hero-btn--primary" href="/offers">
            مشاهدة العروض
          </Link>
          <Link className="hero-btn hero-btn--secondary" href="/contact">
            تواصل مع خبيرة الجمال
          </Link>
          {selectedCategory !== "all" ? (
            <Link className="hero-btn hero-btn--secondary" href="/store">
              عرض كل المنتجات
            </Link>
          ) : null}
        </div>
      </section>

      <section className="info-strip" aria-label="نقاط سريعة عن المتجر">
        <article className="info-strip__card">
          <p className="info-strip__value">+240</p>
          <p className="info-strip__label">منتج متاح</p>
        </article>
        <article className="info-strip__card">
          <p className="info-strip__value">24h</p>
          <p className="info-strip__label">توصيل سريع</p>
        </article>
        <article className="info-strip__card">
          <p className="info-strip__value">4.9/5</p>
          <p className="info-strip__label">رضا العملاء</p>
        </article>
      </section>

      {selectedCategory !== "all" ? (
        <section className="mt-4 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3">
          <p className="text-sm font-black text-zinc-900">
            التصفية الحالية: {CATEGORY_LABELS[selectedCategory as ProductCategory]}
          </p>
        </section>
      ) : null}

      <section className="mt-4 grid gap-3 rounded-2xl border border-orange-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
        <input
          className="form-input"
          type="search"
          placeholder="ابحثي عن منتج"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setCurrentPage(1);
          }}
        />
        <select
          className="form-input"
          value={selectedCategory}
          onChange={(event) => {
            setSelectedCategory(event.target.value as ProductCategory | "all");
            setCurrentPage(1);
          }}
        >
          <option value="all">كل الفئات</option>
          {CATEGORY_KEYS.map((categoryKey) => (
            <option key={categoryKey} value={categoryKey}>
              {CATEGORY_LABELS[categoryKey]}
            </option>
          ))}
        </select>
        <select
          className="form-input"
          value={sortBy}
          onChange={(event) => {
            setSortBy(event.target.value as "featured" | "price-asc" | "price-desc" | "rating" | "newest");
            setCurrentPage(1);
          }}
        >
          <option value="featured">الأفضل مبيعًا</option>
          <option value="price-asc">السعر: الأقل أولًا</option>
          <option value="price-desc">السعر: الأعلى أولًا</option>
          <option value="rating">الأعلى تقييمًا</option>
          <option value="newest">الأحدث</option>
        </select>
        <label className="flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-sm font-bold text-zinc-700">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(event) => {
              setInStockOnly(event.target.checked);
              setCurrentPage(1);
            }}
          />
          المتوفر فقط
        </label>
        <input
          className="form-input"
          type="number"
          min={0}
          placeholder="أقل سعر"
          value={minPrice}
          onChange={(event) => {
            setMinPrice(event.target.value);
            setCurrentPage(1);
          }}
        />
        <input
          className="form-input"
          type="number"
          min={0}
          placeholder="أعلى سعر"
          value={maxPrice}
          onChange={(event) => {
            setMaxPrice(event.target.value);
            setCurrentPage(1);
          }}
        />
        <select
          className="form-input"
          value={minRating}
          onChange={(event) => {
            setMinRating(event.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="0">كل التقييمات</option>
          <option value="4">4+ نجوم</option>
          <option value="4.5">4.5+ نجوم</option>
          <option value="4.8">4.8+ نجوم</option>
        </select>
        <button
          className="hero-btn hero-btn--secondary"
          type="button"
          onClick={() => {
            setQuery("");
            setSelectedCategory("all");
            setSortBy("featured");
            setMinPrice("");
            setMaxPrice("");
            setMinRating("0");
            setInStockOnly(false);
            setCurrentPage(1);
          }}
        >
          تصفير الفلاتر
        </button>
      </section>

      <section className="mt-4 rounded-2xl border border-orange-200 bg-gradient-to-l from-rose-50 via-orange-50 to-amber-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black text-orange-700">رف الأسبوع</p>
            <h2 className="mt-1 text-xl font-black text-zinc-900">مختارات عطرية بواجهة أكثر فخامة</h2>
          </div>
          <Link className="hero-btn hero-btn--primary" href="/offers">
            اكتشفي العروض
          </Link>
        </div>
      </section>

      <section className="product-grid" aria-label="منتجات المتجر">
        {paginatedProducts.map((product) => {
          const cardImage = product.imageGallery?.[0] || product.imagePath;
          const isInStock = product.stock > 0;

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
                priority={false}
              />
            </div>
            <span className="product-card__badge">{product.badge}</span>
            <h2 className="product-card__name">{product.name}</h2>
            <p className="product-card__category">{product.categoryLabel}</p>

            <div className="product-card__meta-row">
              <span className="product-card__meta-pill product-card__meta-pill--rating">
                ⭐ {product.rating}
              </span>
              <span className={`product-card__meta-pill ${isInStock ? "product-card__meta-pill--stock" : "product-card__meta-pill--soldout"}`}>
                {isInStock ? `متوفر ${product.stock}` : "نفد"}
              </span>
            </div>

            <p className="product-card__desc">{product.shortDescription}</p>

            <div className="product-card__foot">
              <div className="product-card__price-wrap">
                <p className="product-card__price-label">السعر</p>
                <p className="product-card__price">{formatPrice(product.price, currencySymbol)}</p>
              </div>
              <div className="product-card__actions">
                {isInStock ? <AddToCartButton className="product-card__cta product-card__cta--primary" productId={product.id} /> : null}
                <WishlistToggle className="product-card__cta product-card__cta--ghost" productId={product.id} />
                <Link className="product-card__cta product-card__cta--ghost product-card__cta--full" href={`/store/${product.id}`}>
                  التفاصيل
                </Link>
              </div>
            </div>
          </article>
          );
        })}
      </section>

      <section className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold text-zinc-700">عدد النتائج: {filteredProducts.length}</p>
        <div className="flex items-center gap-2">
          <button
            className="hero-btn hero-btn--secondary"
            type="button"
            disabled={safePage <= 1}
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
          >
            السابق
          </button>
          <span className="text-sm font-black text-zinc-800">
            صفحة {safePage} من {totalPages}
          </span>
          <button
            className="hero-btn hero-btn--secondary"
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
          >
            التالي
          </button>
        </div>
      </section>

      <div className="inner-page__actions">
        <Link className="hero-btn hero-btn--primary" href="/offers">
          انتقل للعروض الحصرية
        </Link>
        <Link className="hero-btn hero-btn--secondary" href="/categories">
          تصفح حسب الفئة
        </Link>
      </div>
    </main>
  );
}
