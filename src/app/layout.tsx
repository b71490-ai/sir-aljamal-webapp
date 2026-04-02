import type { Metadata } from "next";
import { Cairo, Geist_Mono } from "next/font/google";
import CartProvider from "@/components/cart-provider";
import MobileDock from "@/components/mobile-dock";
import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";
import "./globals.css";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "سر الجمال | العروض اليومية للجمال والعناية",
  description: "سر الجمال منصة عربية للعناية والجمال بعروض يومية وتجربة شراء سريعة ومتوافقة مع الجوال.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      className={`${cairo.variable} ${geistMono.variable} h-full antialiased`}
    >
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
