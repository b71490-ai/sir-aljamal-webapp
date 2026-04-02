import Link from "next/link";

const FOOTER_LINKS = [
  { href: "/store", label: "تسوقي الآن" },
  { href: "/offers", label: "العروض" },
  { href: "/categories", label: "الفئات" },
  { href: "/policies", label: "السياسات" },
  { href: "/contact", label: "الدعم" },
];

export default function SiteFooter() {
  return (
    <footer className="site-footer" dir="rtl">
      <div className="site-shell site-footer__inner">
        <section>
          <p className="site-footer__kicker">Beauty Commerce</p>
          <h2 className="site-footer__title">سر الجمال</h2>
          <p className="site-footer__copy">
            منصة عربية حديثة تجمع العناية والجمال في تجربة شراء سريعة وآمنة ومريحة للجوال.
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

        <section>
          <h3 className="site-footer__section-title">تواصل مباشر</h3>
          <div className="site-footer__contact">
            <a href="tel:+966500000000">+966 50 000 0000</a>
            <a href="mailto:support@siraljamal.sa">support@siraljamal.sa</a>
          </div>
        </section>
      </div>

      <div className="site-footer__copyright">© 2026 سر الجمال - جميع الحقوق محفوظة</div>
    </footer>
  );
}
