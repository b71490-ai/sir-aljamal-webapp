"use client";

import { useMemo } from "react";
import { useDashboardSettingsLive } from "@/lib/use-dashboard-settings-live";

type FooterContactLiveProps = {
  initialWhatsappNumber: string;
  initialSupportEmail: string;
  initialFooterContactTitle: string;
};

function normalizeWhatsapp(value: unknown, fallback: string) {
  const digits = String(value || "").replace(/\D/g, "");
  return digits || fallback;
}

function normalizeText(value: unknown, fallback: string) {
  const text = String(value || "").trim();
  return text || fallback;
}

export default function FooterContactLive({
  initialWhatsappNumber,
  initialSupportEmail,
  initialFooterContactTitle,
}: FooterContactLiveProps) {
  const settings = useDashboardSettingsLive({
    whatsappNumber: initialWhatsappNumber,
    supportEmail: initialSupportEmail,
    footerContactTitle: initialFooterContactTitle,
  });

  const whatsappNumber = normalizeWhatsapp(settings.whatsappNumber, initialWhatsappNumber);
  const supportEmail = normalizeText(settings.supportEmail, initialSupportEmail);
  const footerContactTitle = normalizeText(settings.footerContactTitle, initialFooterContactTitle);

  const phoneHref = useMemo(() => `tel:+${whatsappNumber}`, [whatsappNumber]);
  const emailHref = useMemo(() => `mailto:${supportEmail}`, [supportEmail]);

  return (
    <section>
      <h3 className="site-footer__section-title">{footerContactTitle}</h3>
      <div className="site-footer__contact">
        <a className="site-footer__contact-item site-footer__contact-item--phone" href={phoneHref} dir="ltr">
          <bdi>+{whatsappNumber}</bdi>
        </a>
        <a className="site-footer__contact-item" href={emailHref}>{supportEmail}</a>
        <a className="site-footer__quick-link" href="/account">ملف العميلة</a>
        <a className="site-footer__quick-link" href="/admin">لوحة الإدارة</a>
      </div>
    </section>
  );
}