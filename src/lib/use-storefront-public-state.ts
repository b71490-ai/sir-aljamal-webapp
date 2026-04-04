"use client";

import { useEffect, useMemo, useState } from "react";
import { OFFERS, type Offer } from "@/data/offers";
import { PRODUCTS } from "@/data/products";
import type { AdminOffer, AdminProduct, DashboardSettings } from "@/lib/admin-storage";

const PUBLIC_STATE_API = "/api/public/state";
const POLL_MS = 8000;

type PublicSettings = Pick<DashboardSettings,
  | "whatsappNumber"
  | "supportEmail"
  | "brandLogoPath"
  | "footerContactTitle"
  | "workingHoursLabel"
  | "currencyCode"
  | "currencySymbol"
  | "lowStockThreshold"
  | "smartMode"
  | "walletName"
  | "walletAccountNumber"
  | "paymentMethods"
>;

type PublicStorefrontState = {
  revision: number;
  updatedAt: string;
  products: AdminProduct[];
  offers: Offer[];
  settings: PublicSettings;
};

type PublicStateResponse = {
  revision?: unknown;
  updatedAt?: unknown;
  products?: unknown;
  offers?: unknown;
  settings?: unknown;
};

const FALLBACK_SETTINGS: PublicSettings = {
  whatsappNumber: "966500000000",
  supportEmail: "support@siraljamal.sa",
  brandLogoPath: "/brand/sir-aljamal-logo.svg",
  footerContactTitle: "أتيلية العطر",
  workingHoursLabel: "يوميًا من 10 صباحًا حتى 11 مساءً",
  currencyCode: "SAR",
  currencySymbol: "ر.س",
  lowStockThreshold: 8,
  smartMode: true,
  walletName: "المحفظة الرئيسية",
  walletAccountNumber: "777123456",
  paymentMethods: [],
};

const FALLBACK_PRODUCTS: AdminProduct[] = PRODUCTS.map((item) => ({
  ...item,
  sku: "",
  stock: 10,
  isActive: true,
  sales: 0,
  updatedAt: "",
}));

const FALLBACK_STATE: PublicStorefrontState = {
  revision: 0,
  updatedAt: "",
  products: FALLBACK_PRODUCTS,
  offers: OFFERS,
  settings: FALLBACK_SETTINGS,
};

function sanitizeSettings(value: unknown): PublicSettings {
  if (!value || typeof value !== "object") {
    return FALLBACK_SETTINGS;
  }

  const settings = value as Partial<PublicSettings>;
  const rawLogoPath = String(settings.brandLogoPath || "").trim();
  const brandLogoPath = rawLogoPath.startsWith("/")
    ? rawLogoPath
    : rawLogoPath.startsWith("brand/")
      ? `/${rawLogoPath}`
      : rawLogoPath.startsWith("data:image/")
        ? rawLogoPath
      : FALLBACK_SETTINGS.brandLogoPath;

  return {
    whatsappNumber: String(settings.whatsappNumber || FALLBACK_SETTINGS.whatsappNumber).replace(/\D/g, "") || FALLBACK_SETTINGS.whatsappNumber,
    supportEmail: String(settings.supportEmail || FALLBACK_SETTINGS.supportEmail).trim() || FALLBACK_SETTINGS.supportEmail,
    brandLogoPath,
    footerContactTitle: String(settings.footerContactTitle || FALLBACK_SETTINGS.footerContactTitle).trim() || FALLBACK_SETTINGS.footerContactTitle,
    workingHoursLabel: String(settings.workingHoursLabel || FALLBACK_SETTINGS.workingHoursLabel).trim() || FALLBACK_SETTINGS.workingHoursLabel,
    currencyCode: settings.currencyCode === "USD" || settings.currencyCode === "YER" || settings.currencyCode === "SAR"
      ? settings.currencyCode
      : FALLBACK_SETTINGS.currencyCode,
    currencySymbol: String(settings.currencySymbol || FALLBACK_SETTINGS.currencySymbol).trim() || FALLBACK_SETTINGS.currencySymbol,
    lowStockThreshold: Number.isFinite(Number(settings.lowStockThreshold)) ? Math.max(1, Number(settings.lowStockThreshold)) : FALLBACK_SETTINGS.lowStockThreshold,
    smartMode: settings.smartMode !== false,
    walletName: String(settings.walletName || FALLBACK_SETTINGS.walletName).trim() || FALLBACK_SETTINGS.walletName,
    walletAccountNumber: String(settings.walletAccountNumber || FALLBACK_SETTINGS.walletAccountNumber).trim() || FALLBACK_SETTINGS.walletAccountNumber,
    paymentMethods: Array.isArray(settings.paymentMethods) ? settings.paymentMethods : FALLBACK_SETTINGS.paymentMethods,
  };
}

function sanitizeProducts(value: unknown): AdminProduct[] {
  if (!Array.isArray(value)) {
    return FALLBACK_PRODUCTS;
  }
  return (value as AdminProduct[]).filter((item) => item && typeof item === "object" && Boolean(item.id));
}

function sanitizeOffers(value: unknown): Offer[] {
  if (!Array.isArray(value)) {
    return OFFERS;
  }

  const offers = (value as AdminOffer[])
    .filter((item) => item && typeof item === "object" && Boolean(item.id))
    .map((item) => ({ ...item } as Offer));

  return offers.length > 0 ? offers : OFFERS;
}

function toPublicState(payload: PublicStateResponse): PublicStorefrontState {
  return {
    revision: Number(payload.revision) || 0,
    updatedAt: String(payload.updatedAt || ""),
    products: sanitizeProducts(payload.products),
    offers: sanitizeOffers(payload.offers),
    settings: sanitizeSettings(payload.settings),
  };
}

export function useStorefrontPublicState(initialState?: Partial<PublicStorefrontState>) {
  const seeded = useMemo<PublicStorefrontState>(() => ({
    ...FALLBACK_STATE,
    ...initialState,
    settings: {
      ...FALLBACK_SETTINGS,
      ...(initialState?.settings || {}),
    },
    products: initialState?.products && initialState.products.length > 0 ? initialState.products : FALLBACK_STATE.products,
    offers: initialState?.offers && initialState.offers.length > 0 ? initialState.offers : FALLBACK_STATE.offers,
  }), [initialState]);

  const [state, setState] = useState<PublicStorefrontState>(seeded);

  useEffect(() => {
    let cancelled = false;

    const syncNow = async () => {
      try {
        const response = await fetch(PUBLIC_STATE_API, { method: "GET", cache: "no-store" });
        if (!response.ok || cancelled) {
          return;
        }

        const payload = (await response.json()) as PublicStateResponse;
        if (cancelled) {
          return;
        }

        setState((prev) => {
          const next = toPublicState(payload);
          if (next.revision <= prev.revision) {
            return prev;
          }
          return next;
        });
      } catch {
        // Ignore transient network failures; next polling cycle will retry.
      }
    };

    void syncNow();
    const intervalId = window.setInterval(() => {
      void syncNow();
    }, POLL_MS);

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void syncNow();
      }
    };

    window.addEventListener("focus", onVisibility);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", onVisibility);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return state;
}
