import type { Metadata } from "next";
import CartProvider from "@/components/cart-provider";
import MobileDock from "@/components/mobile-dock";
import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://siraljamal.sa"),
  title: "سر الجمال | العروض اليومية للجمال والعناية",
  description: "سر الجمال منصة عربية للعناية والجمال بعروض يومية وتجربة شراء سريعة ومتوافقة مع الجوال.",
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "سر الجمال | العروض اليومية للجمال والعناية",
    description: "سر الجمال منصة عربية للعناية والجمال بعروض يومية وتجربة شراء سريعة ومتوافقة مع الجوال.",
    type: "website",
    locale: "ar_SA",
    siteName: "سر الجمال",
  },
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" className="h-full antialiased">
      <body className="site-body min-h-full flex flex-col">
        <CartProvider>
          <SiteHeader />
          <div className="site-main">{children}</div>
          <SiteFooter />
          <MobileDock />
        </CartProvider>
      </body>
    </html>
  );
}
