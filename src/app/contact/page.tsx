import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import ContactRequestForm from "@/components/contact-request-form";
import { getProductById } from "@/data/products";
import { readServerAdminState } from "@/lib/server-admin-db";

type ContactPageProps = {
  searchParams: Promise<{
    product?: string;
  }>;
};

export default async function ContactPage({ searchParams }: ContactPageProps) {
  noStore();
  const { product } = await searchParams;
  const state = await readServerAdminState();
  const selectedProduct = product
    ? state.products.find((item) => item.id === product) || getProductById(product)
    : null;
  const whatsappNumber = state.settings.whatsappNumber || "966500000000";
  const supportEmail = state.settings.supportEmail || "support@siraljamal.sa";
  const workingHoursLabel = state.settings.workingHoursLabel || "يوميًا من 10 صباحًا حتى 11 مساءً";

  return (
    <main className="inner-page site-shell" dir="rtl">
      <section className="inner-page__hero">
        <p className="inner-page__kicker">تواصل</p>
        <h1 className="inner-page__title">تواصل مع سر الجمال</h1>
        <p className="inner-page__desc">
          فريقنا جاهز لمساعدتك في اختيار المنتجات المناسبة ومتابعة طلباتك بسرعة.
        </p>
      </section>

      <section className="info-strip" aria-label="مؤشرات الدعم">
        <article className="info-strip__card">
          <p className="info-strip__value">7/7</p>
          <p className="info-strip__label">دعم يومي</p>
        </article>
        <article className="info-strip__card">
          <p className="info-strip__value">5m</p>
          <p className="info-strip__label">متوسط الرد</p>
        </article>
        <article className="info-strip__card">
          <p className="info-strip__value">فوري</p>
          <p className="info-strip__label">واتساب مباشر</p>
        </article>
      </section>

      <section className="contact-grid">
        <article className="contact-card">
          <h2>واتساب الطلبات</h2>
          <p dir="ltr">+{whatsappNumber}</p>
          <a className="contact-link" href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noreferrer">
            فتح واتساب
          </a>
        </article>
        <article className="contact-card">
          <h2>البريد الإلكتروني</h2>
          <p>{supportEmail}</p>
          <a className="contact-link" href={`mailto:${supportEmail}`}>
            ارسال بريد
          </a>
        </article>
        <article className="contact-card">
          <h2>ساعات العمل</h2>
          <p>{workingHoursLabel}</p>
          <a className="contact-link" href={`tel:+${whatsappNumber}`}>
            اتصال مباشر
          </a>
        </article>
      </section>

      <section className="contact-card mt-4">
        <h2>طلب استشارة سريعة</h2>
        <p>
          ارسلي بياناتك وسيتواصل معك فريق سر الجمال لاختيار المنتجات الأنسب لك.
          بعد الإرسال تحصلين مباشرة على رقم تذكرة لمتابعة الطلب من لوحة الدعم.
        </p>
        {selectedProduct ? (
          <p className="mt-3 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-bold text-orange-800">
            المنتج المختار: {selectedProduct.name}
          </p>
        ) : null}
        <ContactRequestForm selectedProductName={selectedProduct?.name} />
      </section>

      <div className="inner-page__actions">
        <Link className="hero-btn hero-btn--primary" href="/store">
          العودة للمتجر
        </Link>
        <Link className="hero-btn hero-btn--secondary" href="/policies">
          قراءة السياسات
        </Link>
        <Link className="hero-btn hero-btn--secondary" href="/offers">
          مشاهدة العروض
        </Link>
        <Link className="hero-btn hero-btn--secondary" href="/track-order">
          تتبع طلبك
        </Link>
      </div>
    </main>
  );
}
