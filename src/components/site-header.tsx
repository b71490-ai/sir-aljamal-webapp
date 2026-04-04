"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/components/cart-provider";
import SiteSearch from "@/components/site-search";

const NAV_ITEMS = [
  { href: "/", label: "الرئيسية" },
  { href: "/store", label: "المتجر" },
  { href: "/account", label: "حسابي" },
  { href: "/wishlist", label: "المفضلة" },
  { href: "/offers", label: "العروض" },
  { href: "/categories", label: "الفئات" },
  { href: "/track-order", label: "تتبع الطلب" },
  { href: "/contact", label: "تواصل" },
  { href: "/admin", label: "التحكم" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const { totalItems } = useCart();

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <header className="site-header" dir="rtl">
      <div className="site-shell site-header__inner">
        <Link className="brand-block" href="/" aria-label="سر الجمال">
          <span className="brand-block__tag">Maison De Beauty</span>
          <strong className="brand-block__name">سر الجمال</strong>
        </Link>

        <nav className="site-nav" aria-label="التنقل الرئيسي">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              className={`site-nav__link ${isActive(item.href) ? "is-active" : ""}`}
              href={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <SiteSearch />

        <div className="site-header__actions">
          <Link className="site-btn site-btn--ghost" href="/account">
            حسابي
          </Link>
          <Link className="site-btn site-btn--ghost" href="/wishlist">
            المفضلة
          </Link>
          <Link className="site-btn site-btn--ghost" href="/checkout">
            السلة ({totalItems})
          </Link>
          <Link className="site-btn site-btn--ghost" href="/contact">
            مستشارة العطر
          </Link>
          <Link className="site-btn site-btn--solid" href="/store">
            اكتشفي التشكيلة
          </Link>
        </div>
      </div>
    </header>
  );
}
