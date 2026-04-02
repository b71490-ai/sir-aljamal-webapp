import Link from "next/link";
import ContactRequestForm from "@/components/contact-request-form";
import { getProductById } from "@/data/products";

type ContactPageProps = {
  searchParams: Promise<{
    product?: string;
  }>;
};

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const { product } = await searchParams;
  const selectedProduct = product ? getProductById(product) : null;

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
          <p>+966 50 000 0000</p>
          <a className="contact-link" href="https://wa.me/966500000000" target="_blank" rel="noreferrer">
            فتح واتساب
          </a>
        </article>
        <article className="contact-card">
          <h2>البريد الإلكتروني</h2>
          <p>support@siraljamal.sa</p>
          <a className="contact-link" href="mailto:support@siraljamal.sa">
            ارسال بريد
          </a>
        </article>
        <article className="contact-card">
          <h2>ساعات العمل</h2>
          <p>يوميًا من 10 صباحًا حتى 11 مساءً</p>
          <a className="contact-link" href="tel:+966500000000">
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
      </div>
    </main>
  );
}
