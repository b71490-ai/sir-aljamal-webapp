"use client";

import AdsSlider from "@/components/ads-slider";
import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import {
  buildDashboardInsights,
  getAdminLeads,
  getAdminOrders,
  getAdminProducts,
} from "@/lib/admin-storage";
import { getActiveOffers } from "@/data/offers";
import { PRODUCTS } from "@/data/products";
import { getLoyaltyPoints } from "@/lib/storefront-storage";
import { useDashboardSettingsLive } from "@/lib/use-dashboard-settings-live";

function formatPrice(price: number, currencySymbol: string) {
  return `${price} ${currencySymbol}`;
}

function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export default function Home() {
  const hydrated = useHydrated();
  const fallbackProducts = useMemo(
    () => PRODUCTS.map((item) => ({ ...item, stock: 10, sales: 0, isActive: true, sku: "", updatedAt: "" })),
    [],
  );
  const products = useMemo(() => (hydrated ? getAdminProducts() : fallbackProducts), [hydrated, fallbackProducts]);
  const orders = useMemo(() => (hydrated ? getAdminOrders() : []), [hydrated]);
  const leads = useMemo(() => (hydrated ? getAdminLeads() : []), [hydrated]);
  const settings = useDashboardSettingsLive();
  const loyaltyPoints = useMemo(() => (hydrated ? getLoyaltyPoints() : 0), [hydrated]);

  const insights = useMemo(
    () => buildDashboardInsights(products, orders, leads, settings),
    [products, orders, leads, settings],
  );
  const activeOffers = useMemo(() => getActiveOffers(), []);
  const featuredProducts = useMemo(() => {
    const targetCategories = activeOffers
      .map((offer) => offer.rule.category)
      .filter(Boolean);

    const items = products
      .filter((product) => product.isActive && product.stock > 0)
      .filter((product) => targetCategories.length === 0 || targetCategories.includes(product.category))
      .sort((a, b) => b.sales - a.sales);

    return items.slice(0, 4);
  }, [activeOffers, products]);

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "سر الجمال",
    url: typeof window === "undefined" ? (process.env.NEXT_PUBLIC_SITE_URL || "https://siraljamal.sa") : window.location.origin,
    potentialAction: {
      "@type": "SearchAction",
      target: `${typeof window === "undefined" ? (process.env.NEXT_PUBLIC_SITE_URL || "https://siraljamal.sa") : window.location.origin}/store?query={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <main className="landing-root relative overflow-x-clip pb-24" dir="rtl">
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
      <div className="hero-noise absolute inset-0 -z-20" />
      <div className="hero-glow hero-glow--top absolute -top-20 -right-16 -z-10" />
      <div className="hero-glow hero-glow--bottom absolute bottom-28 -left-20 -z-10" />

      <section className="site-shell px-4 pt-4 sm:px-6 sm:pt-5">
        <div className="trend-ribbon animate-slide-up">
          <p className="trend-ribbon__label">ترند اليوم</p>
          <div className="trend-ribbon__items">
            {activeOffers.slice(0, 3).map((offer) => (
              <span key={offer.id}>{offer.title}</span>
            ))}
          </div>
          <Link className="trend-ribbon__cta" href="/offers">
            عرض التفاصيل
          </Link>
        </div>
      </section>

      <section className="site-shell grid gap-4 px-4 pt-6 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-6 lg:pt-10">
        <article className="hero-panel animate-slide-up rounded-[30px] p-5 sm:p-8">
          <div className="hero-topline">
            <span className="hero-topline__pill">دار سر الجمال</span>
            <span className="hero-topline__status">تشكيلات عطرية فاخرة</span>
          </div>

          <h1 className="mt-4 text-3xl font-black leading-tight text-amber-50 sm:text-4xl lg:text-5xl">
            <span className="hero-title-glow">سر الجمال</span>
            <br />
            عطور تترك أثرًا أنيقًا قبل أن تُرى
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-8 text-amber-50/78 sm:text-base">
            متجر بطابع برفيوم فاخر يقدم تشكيلات منتقاة من العطور والجمال، مع عرض بصري راقٍ،
            بطاقات ناعمة، ومزيج من الألوان الدافئة المستوحاة من زجاجات العطر الراقية.
          </p>

          <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold text-amber-50/82">
            <span className="trust-pill">منتجات أصلية</span>
            <span className="trust-pill">تغليف فاخر</span>
            <span className="trust-pill">شحن سريع</span>
            <span className="trust-pill">استشارة راقية</span>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-2">
            <Link className="hero-btn hero-btn--primary" href="/store">
              اكتشفي المجموعة
            </Link>
            <Link className="hero-btn hero-btn--secondary" href="/offers">
              عروض الدار
            </Link>
            <Link className="hero-btn hero-btn--soft" href="/categories">
              بحسب النفحات
            </Link>
          </div>

          <div className="mt-7 grid grid-cols-3 gap-2 sm:gap-3">
            <div className="hero-metric bg-amber-50/95">
              <p className="text-[11px] text-amber-900 sm:text-xs">طلبات الدار</p>
              <p className="mt-1 text-base font-black text-zinc-900 sm:text-xl">{insights.ordersCount}</p>
              <Link className="metric-link" href="/store">
                تصفح العطور
              </Link>
            </div>
            <div className="hero-metric bg-orange-50/95">
              <p className="text-[11px] text-orange-900 sm:text-xs">قيمة المبيعات</p>
              <p className="mt-1 text-base font-black text-zinc-900 sm:text-xl">{formatPrice(Math.round(insights.revenue), settings.currencySymbol)}</p>
              <Link className="metric-link" href="/offers">
                شاهدي العروض
              </Link>
            </div>
            <div className="hero-metric bg-stone-50/95">
              <p className="text-[11px] text-stone-900 sm:text-xs">معدل التفاعل</p>
              <p className="mt-1 text-base font-black text-zinc-900 sm:text-xl">{insights.conversionRate.toFixed(1)}%</p>
              <Link className="metric-link" href="/contact">
                اسألي المستشارة
              </Link>
            </div>
          </div>
        </article>

        <aside className="grid gap-4">
          <div className="hero-offer-card animate-slide-up">
            <p className="text-xs font-bold text-amber-100">مختبر العطر لهذا الأسبوع</p>
            <h2 className="mt-2 text-2xl font-black leading-tight text-white sm:text-3xl">
              مجموعة السهرات المخملية
              <br />
              بنفحات دافئة وتغليف ذهبي
            </h2>
            <p className="mt-3 text-sm text-stone-100/90">
              تشكيلات ذات حضور فاخر مستوحاة من متاجر العطور الراقية، مع خصومات يومية وشحن أنيق.
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs text-stone-100">
              <span className="rounded-full bg-white/15 px-2 py-1">نفحات شرقية</span>
              <span className="rounded-full bg-white/15 px-2 py-1">شحن فاخر</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link className="hero-btn hero-btn--white" href="/offers">
                فعّلي العرض
              </Link>
              <Link className="hero-btn hero-btn--outline-light" href="/store">
                تصفح المنتجات
              </Link>
            </div>
          </div>

          <div className="hero-quick-list animate-slide-up">
            <h3 className="text-sm font-black text-zinc-900">الهوية الجديدة للعرض</h3>
            <ul className="mt-4 space-y-2 text-sm text-zinc-700">
              <li>• طابع بصري قريب من متاجر البرفيوم الفاخرة</li>
              <li>• ألوان دافئة بلمسات ذهبية وبنية عميقة</li>
              <li>• مساحات عرض ناعمة تبرز المنتج والعرض معًا</li>
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link className="mini-link" href="/categories">
                تصفح الفئات
              </Link>
              <Link className="mini-link" href="/policies">
                اطلعي على السياسات
              </Link>
            </div>
          </div>

          <div className="hero-score-card animate-slide-up">
            <p className="hero-score-card__kicker">مؤشر الفخامة</p>
            <p className="hero-score-card__score">{formatPrice(Number(insights.avgOrderValue.toFixed(0)), settings.currencySymbol)}</p>
            <p className="hero-score-card__desc">
              متوسط السلة الحالية يعكس القيمة الشرائية داخل المتجر بعد تحويله لهوية عطرية أكثر رقيًا.
            </p>
            <Link className="mini-link mt-3" href="/store">
              ابدئي تجربتك
            </Link>
          </div>
        </aside>
      </section>

      <section className="site-shell mt-5 px-4 sm:px-6 lg:mt-7">
        <div className="section-head mb-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-600">
              عروض العطور
            </p>
            <h2 className="mt-1 text-xl font-black text-zinc-900 sm:text-2xl">
              عروض دار سر الجمال
            </h2>
          </div>
          <p className="hidden text-sm text-zinc-500 sm:block">اسحب يمين ويسار على الجوال</p>
        </div>
        <AdsSlider />
      </section>

      <section className="site-shell mt-6 px-4 sm:px-6">
        <div className="section-head mb-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-600">توصيات اليوم</p>
            <h2 className="mt-1 text-xl font-black text-zinc-900 sm:text-2xl">مختارات تشبه رف العطور الفاخر</h2>
          </div>
          <Link className="mini-link" href="/store">
            عرض الكل
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {featuredProducts.map((product) => (
            <article key={product.id} className="feature-card feature-card--light">
              <p className="text-sm font-black text-zinc-900">{product.name}</p>
              <p className="mt-2 text-sm text-zinc-700">{product.shortDescription}</p>
              <p className="mt-2 text-xs font-black text-orange-700">{formatPrice(product.price, settings.currencySymbol)}</p>
              <Link className="mini-link mt-4" href={`/store/${product.id}`}>
                مشاهدة المنتج
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="site-shell mt-6 px-4 sm:px-6">
        <div className="luxury-banner animate-slide-up">
          <div>
            <p className="luxury-banner__kicker">تشكيلات موسمية</p>
            <h2 className="luxury-banner__title">نفحات موسمية بتقديم يشبه بوتيكات البرفيوم</h2>
            <p className="luxury-banner__desc">
              تنسيق بصري أعمق، بطاقات أهدأ، وعناصر أوضح لإبراز الفخامة بدون ازدحام.
            </p>
          </div>
          <div className="luxury-banner__chips">
            <span>عنبر</span>
            <span>فانيلا</span>
            <span>عود</span>
          </div>
          <div className="luxury-banner__actions">
            <Link className="hero-btn hero-btn--primary" href="/categories">
              تصفح اللوكات
            </Link>
            <Link className="hero-btn hero-btn--secondary" href="/contact">
              احجزي توصية خبيرة
            </Link>
          </div>
        </div>
      </section>

      <section className="site-shell mt-6 px-4 sm:px-6">
        <div className="beauty-showcase">
          <article className="beauty-showcase__card beauty-showcase__card--pearl">
            <p className="beauty-showcase__kicker">اختيار محررات الجمال</p>
            <h3 className="beauty-showcase__title">زاوية عطرية تبني الانطباع من أول نظرة</h3>
            <p className="beauty-showcase__desc">
              عرض أنيق بتوازن مدروس بين المنتج والنص، يشبه صفحات المتاجر المتخصصة في البرفيوم.
            </p>
            <Link className="mini-link mt-4" href="/store?category=skin-care">
              ابدئي روتين البشرة
            </Link>
          </article>
          <article className="beauty-showcase__card beauty-showcase__card--sun">
            <p className="beauty-showcase__kicker">تجربة شخصية</p>
            <h3 className="beauty-showcase__title">توصيات مخصصة حسب المزاج والنفحات المفضلة</h3>
            <p className="beauty-showcase__desc">
              هوية فاخرة لا تكتفي بالجمال، بل تساعد العميلة تصل لاختيار يشبه ذائقتها بسرعة.
            </p>
            <Link className="mini-link mt-4" href="/contact">
              احجزي توصية سريعة
            </Link>
          </article>
          <article className="beauty-showcase__card beauty-showcase__card--sky">
            <p className="beauty-showcase__kicker">خدمة أسرع</p>
            <h3 className="beauty-showcase__title">رحلة شراء أنيقة من العرض حتى التأكيد</h3>
            <p className="beauty-showcase__desc">
              انتقال ناعم بين العروض، المنتجات، والسلة مع مظهر أكثر فخامة ووضوحًا.
            </p>
            <Link className="mini-link mt-4" href="/checkout">
              اذهبي للسلة
            </Link>
          </article>
        </div>
      </section>

      <section className="site-shell mt-8 px-4 sm:px-6">
        <div className="section-head mb-3">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-600">
            لماذا نحن
          </p>
          <h2 className="mt-1 text-xl font-black text-zinc-900 sm:text-2xl">كل المميزات في منصة واحدة</h2>
        </div>

        <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
          <article className="feature-card feature-card--warm">
            <p className="text-sm font-black text-zinc-900">عروض يومية متجددة</p>
            <p className="mt-2 text-sm leading-7 text-zinc-700">
              شرائح عروض أكثر أناقة تعطي إحساس البراند الفاخر بدل العرض التقليدي.
            </p>
            <Link className="mini-link mt-4" href="/offers">
              انتقل للعروض
            </Link>
          </article>
          <article className="feature-card feature-card--light">
            <p className="text-sm font-black text-zinc-900">دفع آمن ومرن</p>
            <p className="mt-2 text-sm leading-7 text-zinc-700">
              رحلة شراء مستقرة مع لغة بصرية راقية تعكس جودة البراند وتزيد الثقة.
            </p>
            <Link className="mini-link mt-4" href="/policies">
              تفاصيل الدفع
            </Link>
          </article>
          <article className="feature-card feature-card--mint">
            <p className="text-sm font-black text-zinc-900">توصيل سريع</p>
            <p className="mt-2 text-sm leading-7 text-zinc-700">
              تجربة أقرب للمتاجر المتخصصة: منتج بارز، عرض واضح، ولمسة فخامة في التفاصيل.
            </p>
            <Link className="mini-link mt-4" href="/contact">
              سؤال عن التوصيل
            </Link>
          </article>
          <article className="feature-card feature-card--peach">
            <p className="text-sm font-black text-zinc-900">توصيات ذكية</p>
            <p className="mt-2 text-sm leading-7 text-zinc-700">
              اقتراحات منتجات حسب نوع البشرة والشعر لتجربة شخصية أفضل.
            </p>
            <Link className="mini-link mt-4" href="/categories">
              ابدأي حسب نوعك
            </Link>
          </article>
          <article className="feature-card feature-card--blue">
            <p className="text-sm font-black text-zinc-900">خدمة عملاء يومية</p>
            <p className="mt-2 text-sm leading-7 text-zinc-700">
              دعم سريع للطلبات والاستفسارات عبر قنوات متعددة طوال اليوم.
            </p>
            <Link className="mini-link mt-4" href="/contact">
              تواصل الآن
            </Link>
          </article>
          <article className="feature-card feature-card--lilac">
            <p className="text-sm font-black text-zinc-900">برنامج نقاط</p>
            <p className="mt-2 text-sm leading-7 text-zinc-700">
              رصيدك الحالي {loyaltyPoints} نقطة، وكل طلب جديد يضيف نقاطًا تلقائيًا إلى حسابك المحلي على هذا الجهاز.
            </p>
            <Link className="mini-link mt-4" href="/wishlist">
              افتحي رفك الشخصي
            </Link>
          </article>
        </div>
      </section>

      <section className="site-shell mt-8 px-4 sm:px-6">
        <div className="section-head mb-3">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-600">
            الاقسام
          </p>
          <h2 className="mt-1 text-xl font-black text-zinc-900 sm:text-2xl">اكثر الفئات طلبًا</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link className="category-card" href="/store?category=skin-care">
            <h3 className="text-base font-black text-zinc-900">العناية بالبشرة</h3>
            <p className="mt-2 text-sm text-zinc-600">منتجات تنظيف وترطيب وحماية يومية.</p>
          </Link>
          <Link className="category-card" href="/store?category=hair-care">
            <h3 className="text-base font-black text-zinc-900">العناية بالشعر</h3>
            <p className="mt-2 text-sm text-zinc-600">زيوت وشامبو وماسكات لتغذية عميقة.</p>
          </Link>
          <Link className="category-card" href="/store?category=makeup">
            <h3 className="text-base font-black text-zinc-900">المكياج</h3>
            <p className="mt-2 text-sm text-zinc-600">تشكيلة حديثة تناسب الإطلالات اليومية.</p>
          </Link>
          <Link className="category-card" href="/store?category=fragrance">
            <h3 className="text-base font-black text-zinc-900">العطور</h3>
            <p className="mt-2 text-sm text-zinc-600">روائح ثابتة ولمسات فاخرة لكل مناسبة.</p>
          </Link>
        </div>
      </section>

      <section className="site-shell mt-8 px-4 sm:px-6">
        <div className="section-head mb-3">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-600">
            آراء العملاء
          </p>
          <h2 className="mt-1 text-xl font-black text-zinc-900 sm:text-2xl">تجارب حقيقية من مستخدمات سر الجمال</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <article className="testimonial-card">
            <p className="text-sm leading-7 text-zinc-700">
              الواجهة سهلة جدًا على الجوال وقدرت أطلب خلال أقل من دقيقة. التوصيل كان سريع.
            </p>
            <p className="mt-3 text-sm font-black text-zinc-900">نورة - جدة</p>
          </article>
          <article className="testimonial-card">
            <p className="text-sm leading-7 text-zinc-700">
              أحببت العروض المتغيرة يوميًا، كل مرة ألقى شيء جديد ومناسب.
            </p>
            <p className="mt-3 text-sm font-black text-zinc-900">ريم - الرياض</p>
          </article>
          <article className="testimonial-card">
            <p className="text-sm leading-7 text-zinc-700">
              خدمة العملاء ممتازة وسريعة جدًا، ساعدوني باختيار المنتج المناسب لبشرتي.
            </p>
            <p className="mt-3 text-sm font-black text-zinc-900">سارة - الدمام</p>
          </article>
        </div>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Link className="hero-btn hero-btn--primary" href="/store">
            ابدأي الشراء الآن
          </Link>
          <Link className="hero-btn hero-btn--secondary" href="/contact">
            احجزي استشارة سريعة
          </Link>
        </div>
      </section>

      <section className="site-shell mt-8 px-4 sm:px-6">
        <div className="faq-shell">
          <div className="section-head mb-3">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-600">الاسئلة الشائعة</p>
            <h2 className="mt-1 text-xl font-black text-zinc-900 sm:text-2xl">كل ما تحتاج معرفته قبل الطلب</h2>
          </div>
          <div className="space-y-2">
            <details className="faq-item" open>
              <summary>كم يستغرق التوصيل؟</summary>
              <p>في المدن الرئيسية من 4 إلى 24 ساعة حسب وقت الطلب.</p>
            </details>
            <details className="faq-item">
              <summary>هل المنتجات أصلية؟</summary>
              <p>نعم، جميع المنتجات موثقة ومن موردين معتمدين.</p>
            </details>
            <details className="faq-item">
              <summary>هل توجد سياسة استبدال؟</summary>
              <p>
                نعم، يوجد استبدال واسترجاع وفق الشروط الموضحة في
                <Link className="faq-link" href="/policies">
                  صفحة السياسات
                </Link>
                .
              </p>
            </details>
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Link className="hero-btn hero-btn--secondary" href="/policies">
              قراءة كل السياسات
            </Link>
            <Link className="hero-btn hero-btn--primary" href="/contact">
              تواصل مع الدعم
            </Link>
          </div>
        </div>
      </section>

      <section className="site-shell mt-8 px-4 sm:px-6">
        <div className="cta-ribbon animate-slide-up">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-700">انطلقي الآن</p>
            <h2 className="mt-1 text-2xl font-black leading-tight text-zinc-950 sm:text-3xl">
              سر الجمال
              <br />
              جمالك يبدأ من هنا
            </h2>
          </div>
          <Link className="hero-btn hero-btn--primary" href="/store">
            ابدأ التسوق
          </Link>
        </div>
      </section>

    </main>
  );
}
