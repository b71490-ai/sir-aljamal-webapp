import Link from "next/link";
import Image from "next/image";
import { PRODUCTS } from "@/data/products";

const CATEGORIES = [
  {
    id: "skin-care",
    name: "العناية بالبشرة",
    summary: "روتين متكامل للتنظيف والترطيب والحماية اليومية.",
    image: "/products/vitamin-c-serum.svg",
    subcategories: ["تنظيف", "ترطيب", "تفتيح"],
  },
  {
    id: "hair-care",
    name: "العناية بالشعر",
    summary: "منتجات تغذية ولمعان وحماية من التقصف.",
    image: "/products/intense-hair-mask.svg",
    subcategories: ["ترطيب", "إصلاح", "حماية"],
  },
  {
    id: "makeup",
    name: "المكياج",
    summary: "ألوان حديثة وثبات عالي للإطلالة اليومية والمناسبات.",
    image: "/products/soft-touch-foundation.svg",
    subcategories: ["وجه", "عيون", "شفاه"],
  },
  {
    id: "fragrance",
    name: "العطور",
    summary: "تشكيلة عطور أنيقة بروائح ثابتة وفاخرة.",
    image: "/products/signature-fragrance.svg",
    subcategories: ["يومي", "مناسبات", "فاخر"],
  },
];

function countByCategory(categoryId: string) {
  return PRODUCTS.filter((product) => product.category === categoryId).length;
}

export default function CategoriesPage() {
  return (
    <main className="inner-page site-shell" dir="rtl">
      <section className="inner-page__hero">
        <p className="inner-page__kicker">الفئات</p>
        <h1 className="inner-page__title">تسوّقي حسب الفئة</h1>
        <p className="inner-page__desc">اختاري القسم المناسب لك ثم انتقلي مباشرة لمنتجاته المفضلة.</p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs font-black text-zinc-700">
          <span className="trust-pill">فلترة سريعة</span>
          <span className="trust-pill">منتجات أصلية</span>
          <span className="trust-pill">أسعار تنافسية</span>
        </div>
      </section>

      <section className="info-strip" aria-label="ملخص فئات المتجر">
        <article className="info-strip__card">
          <p className="info-strip__value">4</p>
          <p className="info-strip__label">فئات أساسية</p>
        </article>
        <article className="info-strip__card">
          <p className="info-strip__value">منتقى</p>
          <p className="info-strip__label">حسب الجودة</p>
        </article>
        <article className="info-strip__card">
          <p className="info-strip__value">سهل</p>
          <p className="info-strip__label">فلترة دقيقة</p>
        </article>
      </section>

      <section className="category-grid" aria-label="فئات المتجر">
        {CATEGORIES.map((category) => (
          <article key={category.id} className="category-card category-card--page">
            <Image
              src={category.image}
              alt={category.name}
              width={640}
              height={320}
              className="h-40 w-full rounded-2xl object-cover"
            />
            <h2 className="text-lg font-black text-zinc-900">{category.name}</h2>
            <p className="mt-2 text-sm leading-7 text-zinc-700">{category.summary}</p>
            <p className="mt-2 text-xs font-black text-orange-700">
              عدد المنتجات: {countByCategory(category.id)}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {category.subcategories.map((sub) => (
                <span key={sub} className="trust-pill">
                  {sub}
                </span>
              ))}
            </div>
            <div className="offer-card__actions mt-4">
              <Link className="offer-card__link" href={`/store?category=${category.id}`}>
                عرض المنتجات
              </Link>
              <Link className="offer-card__link offer-card__link--ghost" href="/contact">
                اسألي خبيرة
              </Link>
            </div>
          </article>
        ))}
      </section>

      <div className="inner-page__actions">
        <Link className="hero-btn hero-btn--primary" href="/store">
          ابدأي التسوق
        </Link>
        <Link className="hero-btn hero-btn--secondary" href="/offers">
          عروض حسب الفئة
        </Link>
      </div>
    </main>
  );
}
