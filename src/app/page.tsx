"use client";

import AdsSlider from "@/components/ads-slider";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  buildDashboardInsights,
  getAdminLeads,
  getAdminOrders,
  getAdminProducts,
  getDashboardSettings,
} from "@/lib/admin-storage";
import { getActiveOffers } from "@/data/offers";
import { PRODUCTS } from "@/data/products";

function formatPrice(price: number) {
  return `${price} ر.س`;
}

export default function Home() {
  const [products] = useState(() =>
    typeof window === "undefined"
      ? PRODUCTS.map((item) => ({ ...item, stock: 10, sales: 0, isActive: true, sku: "", updatedAt: "" }))
      : getAdminProducts(),
  );
  const [orders] = useState<ReturnType<typeof getAdminOrders>>(() =>
    typeof window === "undefined" ? [] : getAdminOrders(),
  );
  const [leads] = useState<ReturnType<typeof getAdminLeads>>(() =>
    typeof window === "undefined" ? [] : getAdminLeads(),
  );
  const [settings] = useState(() =>
    typeof window === "undefined"
      ? { whatsappNumber: "966500000000", lowStockThreshold: 8, smartMode: true, adminPin: "1234" }
      : getDashboardSettings(),
  );

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

  return (
    <main className="landing-root relative overflow-x-clip pb-24" dir="rtl">
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
            <span className="hero-topline__pill">سر الجمال</span>
            <span className="hero-topline__status">متوافق 100% مع الجوال</span>
          </div>

          <h1 className="mt-4 text-3xl font-black leading-tight text-zinc-950 sm:text-4xl lg:text-5xl">
            <span className="hero-title-glow">سر الجمال</span>
            <br />
            كل ما تحتاجينه للجمال في مكان واحد
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-700 sm:text-base">
            منصة عربية متكاملة للعناية والجمال: عروض يومية، منتجات موثوقة،
            وتوصيل سريع. الواجهة مصممة لتكون مريحة وواضحة على الجوال قبل كل شيء.
          </p>

          <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold text-zinc-700">
            <span className="trust-pill">منتجات أصلية</span>
            <span className="trust-pill">دفع آمن</span>
            <span className="trust-pill">توصيل سريع</span>
            <span className="trust-pill">دعم يومي</span>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-2">
            <Link className="hero-btn hero-btn--primary" href="/store">
              ابدأ الطلب الان
            </Link>
            <Link className="hero-btn hero-btn--secondary" href="/offers">
              استكشف العروض
            </Link>
            <Link className="hero-btn hero-btn--soft" href="/categories">
              اختاري حسب النوع
            </Link>
          </div>

          <div className="mt-7 grid grid-cols-3 gap-2 sm:gap-3">
            <div className="hero-metric bg-amber-50">
              <p className="text-[11px] text-amber-900 sm:text-xs">إجمالي الطلبات</p>
              <p className="mt-1 text-base font-black text-zinc-900 sm:text-xl">{insights.ordersCount}</p>
              <Link className="metric-link" href="/store">
                تسوق الآن
              </Link>
            </div>
            <div className="hero-metric bg-rose-50">
              <p className="text-[11px] text-rose-900 sm:text-xs">إيراد فعلي</p>
              <p className="mt-1 text-base font-black text-zinc-900 sm:text-xl">{Math.round(insights.revenue)} ر.س</p>
              <Link className="metric-link" href="/offers">
                شاهد العروض
              </Link>
            </div>
            <div className="hero-metric bg-lime-50">
              <p className="text-[11px] text-lime-900 sm:text-xs">معدل التحويل</p>
              <p className="mt-1 text-base font-black text-zinc-900 sm:text-xl">{insights.conversionRate.toFixed(1)}%</p>
              <Link className="metric-link" href="/contact">
                اسألي خبيرة
              </Link>
            </div>
          </div>
        </article>

        <aside className="grid gap-4">
          <div className="hero-offer-card animate-slide-up">
            <p className="text-xs font-bold text-rose-50">اعلان مميز هذا الاسبوع</p>
            <h2 className="mt-2 text-2xl font-black leading-tight text-white sm:text-3xl">
              مجموعة سر الجمال
              <br />
              بخصم خاص وتوصيل مجاني
            </h2>
            <p className="mt-3 text-sm text-orange-50">
              اختيارات جاهزة تشمل العناية بالبشرة والشعر مع عرض محدود حتى نهاية الاسبوع.
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs text-orange-50">
              <span className="rounded-full bg-white/20 px-2 py-1">تفعيل فوري</span>
              <span className="rounded-full bg-white/20 px-2 py-1">مناسب للجوال</span>
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
            <h3 className="text-sm font-black text-zinc-900">مميزات سر الجمال</h3>
            <ul className="mt-4 space-y-2 text-sm text-zinc-700">
              <li>• تجربة شراء سهلة من الهاتف بخطوات قصيرة</li>
              <li>• عروض متجددة يوميًا مع سلايدر واضح</li>
              <li>• منتجات مختارة بعناية ونصائح جمالية مفيدة</li>
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
            <p className="hero-score-card__kicker">تقييم المنصة</p>
            <p className="hero-score-card__score">{insights.avgOrderValue.toFixed(0)} ر.س</p>
            <p className="hero-score-card__desc">
              متوسط قيمة الطلب الحالي معتمد مباشرة على الطلبات المسجلة في لوحة التحكم.
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
              عروض مباشرة
            </p>
            <h2 className="mt-1 text-xl font-black text-zinc-900 sm:text-2xl">
              عروض سر الجمال المباشرة
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
            <h2 className="mt-1 text-xl font-black text-zinc-900 sm:text-2xl">منتجات موصى بها ديناميكيًا</h2>
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
              <p className="mt-2 text-xs font-black text-orange-700">{formatPrice(product.price)}</p>
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
            <h2 className="luxury-banner__title">لوكات جاهزة للمناسبات اليومية والخاصة</h2>
            <p className="luxury-banner__desc">
              اختيارات مرتبة حسب المناسبة مع توجيه سريع للمنتجات المناسبة لك.
            </p>
          </div>
          <div className="luxury-banner__chips">
            <span>لوك العمل</span>
            <span>لوك السهرة</span>
            <span>عناية يومية</span>
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
            <h3 className="beauty-showcase__title">روتين صباحي متكامل في 3 دقائق</h3>
            <p className="beauty-showcase__desc">
              منتجات متوازنة للعناية اليومية بترتيب واضح يناسب الاستخدام السريع من الجوال.
            </p>
            <Link className="mini-link mt-4" href="/categories?type=skin-care">
              ابدئي روتين البشرة
            </Link>
          </article>
          <article className="beauty-showcase__card beauty-showcase__card--sun">
            <p className="beauty-showcase__kicker">تجربة شخصية</p>
            <h3 className="beauty-showcase__title">اقتراحات حسب نوع البشرة والشعر</h3>
            <p className="beauty-showcase__desc">
              اختيارات ذكية تساعدك تتجنبي الحيرة وتوصلك للمنتج المناسب بسرعة.
            </p>
            <Link className="mini-link mt-4" href="/contact">
              احجزي توصية سريعة
            </Link>
          </article>
          <article className="beauty-showcase__card beauty-showcase__card--sky">
            <p className="beauty-showcase__kicker">خدمة أسرع</p>
            <h3 className="beauty-showcase__title">تأكيد الطلب خلال ثوانٍ</h3>
            <p className="beauty-showcase__desc">
              سلة مرنة، متابعة مباشرة، وإتمام الطلب بسهولة بدون خطوات معقدة.
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
              تحديث مستمر للعروض المناسبة للمواسم والمناسبات بأسعار منافسة.
            </p>
            <Link className="mini-link mt-4" href="/offers">
              انتقل للعروض
            </Link>
          </article>
          <article className="feature-card feature-card--light">
            <p className="text-sm font-black text-zinc-900">دفع آمن ومرن</p>
            <p className="mt-2 text-sm leading-7 text-zinc-700">
              خيارات متعددة للدفع مع حماية كاملة للبيانات وسهولة اتمام الطلب.
            </p>
            <Link className="mini-link mt-4" href="/policies">
              تفاصيل الدفع
            </Link>
          </article>
          <article className="feature-card feature-card--mint">
            <p className="text-sm font-black text-zinc-900">توصيل سريع</p>
            <p className="mt-2 text-sm leading-7 text-zinc-700">
              توصيل خلال نفس اليوم في المدن الرئيسية مع تتبع مباشر للطلب.
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
              كل طلب يجمع نقاط يمكنك استبدالها بخصومات حقيقية على الطلب القادم.
            </p>
            <Link className="mini-link mt-4" href="/store">
              ابدأ جمع النقاط
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
          <Link className="category-card" href="/categories?type=skin-care">
            <h3 className="text-base font-black text-zinc-900">العناية بالبشرة</h3>
            <p className="mt-2 text-sm text-zinc-600">منتجات تنظيف وترطيب وحماية يومية.</p>
          </Link>
          <Link className="category-card" href="/categories?type=hair-care">
            <h3 className="text-base font-black text-zinc-900">العناية بالشعر</h3>
            <p className="mt-2 text-sm text-zinc-600">زيوت وشامبو وماسكات لتغذية عميقة.</p>
          </Link>
          <Link className="category-card" href="/categories?type=makeup">
            <h3 className="text-base font-black text-zinc-900">المكياج</h3>
            <p className="mt-2 text-sm text-zinc-600">تشكيلة حديثة تناسب الإطلالات اليومية.</p>
          </Link>
          <Link className="category-card" href="/categories?type=fragrance">
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
