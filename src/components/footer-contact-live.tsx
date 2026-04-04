"use client";

import { useEffect, useMemo, useState } from "react";

type FooterContactLiveProps = {
  initialWhatsappNumber: string;
  initialSupportEmail: string;
  initialFooterContactTitle: string;
};

type LocalSettings = {
  whatsappNumber?: unknown;
  supportEmail?: unknown;
  footerContactTitle?: unknown;
};

const STORAGE_KEY = "sir-aljamal-admin-settings";
const SETTINGS_UPDATED_EVENT = "sir-admin-settings-updated";

function readLocalSettings(): LocalSettings | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as LocalSettings;
  } catch {
    return null;
  }
}

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
  const [whatsappNumber, setWhatsappNumber] = useState(initialWhatsappNumber);
  const [supportEmail, setSupportEmail] = useState(initialSupportEmail);
  const [footerContactTitle, setFooterContactTitle] = useState(initialFooterContactTitle);

  const applyFromLocal = () => {
    const local = readLocalSettings();
    if (!local) {
      return;
    }

    setWhatsappNumber((prev) => normalizeWhatsapp(local.whatsappNumber, prev));
    setSupportEmail((prev) => normalizeText(local.supportEmail, prev));
    setFooterContactTitle((prev) => normalizeText(local.footerContactTitle, prev));
  };

  useEffect(() => {
    const syncTimer = window.setTimeout(() => {
      applyFromLocal();
    }, 0);

    const onStorage = (event: StorageEvent) => {
      if (event.key && event.key !== STORAGE_KEY) {
        return;
      }
      applyFromLocal();
    };

    const onSettingsUpdated = () => {
      applyFromLocal();
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener(SETTINGS_UPDATED_EVENT, onSettingsUpdated);
    return () => {
      window.clearTimeout(syncTimer);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(SETTINGS_UPDATED_EVENT, onSettingsUpdated);
    };
  }, []);

  const phoneHref = useMemo(() => `tel:+${whatsappNumber}`, [whatsappNumber]);
  const emailHref = useMemo(() => `mailto:${supportEmail}`, [supportEmail]);

  return (
    <section>
      <h3 className="site-footer__section-title">{footerContactTitle}</h3>
      <div className="site-footer__contact">
        <a href={phoneHref} dir="ltr">
          <bdi>+{whatsappNumber}</bdi>
        </a>
        <a href={emailHref}>{supportEmail}</a>
        <a href="/account">ملف العميلة</a>
        <a href="/admin">لوحة الإدارة</a>
      </div>
    </section>
  );
}