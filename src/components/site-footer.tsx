import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import FooterContactLive from "@/components/footer-contact-live";
import { readServerAdminState } from "@/lib/server-admin-db";

const FOOTER_LINKS = [
  { href: "/store", label: "تسوقي الآن" },
  { href: "/account", label: "حسابي" },
  { href: "/wishlist", label: "المفضلة" },
  { href: "/offers", label: "العروض" },
  { href: "/categories", label: "الفئات" },
  { href: "/track-order", label: "تتبع الطلب" },
  { href: "/policies", label: "السياسات" },
  { href: "/contact", label: "الدعم" },
];

export default async function SiteFooter() {
  noStore();
  const state = await readServerAdminState();
  const whatsappNumber = state.settings.whatsappNumber || "966500000000";
  const supportEmail = state.settings.supportEmail || "support@siraljamal.sa";
  const footerContactTitle = state.settings.footerContactTitle || "أتيلية العطر";

  return (
    <footer className="site-footer" dir="rtl">
      <div className="site-shell site-footer__inner">
        <section>
          <p className="site-footer__kicker">Luxury Fragrance House</p>
          <h2 className="site-footer__title">سر الجمال</h2>
          <p className="site-footer__copy">
            دار عربية فاخرة للعطور والجمال تقدم تشكيلات مختارة، تغليف أنيق، وتجربة شراء تليق بذائقة راقية.
          </p>
        </section>

        <section>
          <h3 className="site-footer__section-title">روابط مهمة</h3>
          <div className="site-footer__links">
            {FOOTER_LINKS.map((item) => (
              <Link key={item.href} href={item.href} className="site-footer__link">
                {item.label}
              </Link>
            ))}
          </div>
        </section>

        <FooterContactLive
          initialWhatsappNumber={whatsappNumber}
          initialSupportEmail={supportEmail}
          initialFooterContactTitle={footerContactTitle}
        />
      </div>

      <div className="site-footer__copyright">© 2026 سر الجمال - جميع الحقوق محفوظة</div>
    </footer>
  );
}
