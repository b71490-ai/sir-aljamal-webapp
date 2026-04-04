"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/components/cart-provider";

const DOCK_ITEMS = [
  { href: "/", label: "الرئيسية" },
  { href: "/store", label: "المتجر" },
  { href: "/account", label: "حسابي" },
  { href: "/wishlist", label: "المفضلة" },
  { href: "/checkout", label: "السلة" },
];

export default function MobileDock() {
  const pathname = usePathname();
  const { totalItems } = useCart();

  return (
    <div className="mobile-dock" dir="rtl">
      {DOCK_ITEMS.map((item) => (
        <Link
          key={item.href}
          className={`mobile-dock__link ${pathname.startsWith(item.href) && (item.href !== "/" || pathname === "/") ? "is-active" : ""}`}
          href={item.href}
        >
          {item.href === "/checkout" ? `${item.label} (${totalItems})` : item.label}
        </Link>
      ))}
    </div>
  );
}
