"use client";

import { type DashboardSettings } from "@/lib/admin-storage";
import { useStorefrontPublicState } from "@/lib/use-storefront-public-state";

const FALLBACK_SETTINGS: DashboardSettings = {
  whatsappNumber: "966500000000",
  supportEmail: "support@siraljamal.sa",
  brandLogoPath: "/brand/sir-aljamal-logo.svg",
  footerContactTitle: "أتيلية العطر",
  workingHoursLabel: "يوميًا من 10 صباحًا حتى 11 مساءً",
  currencyCode: "SAR",
  currencySymbol: "ر.س",
  lowStockThreshold: 8,
  smartMode: true,
  adminPin: "1234",
  walletName: "المحفظة الرئيسية",
  walletAccountNumber: "777123456",
  paymentMethods: [],
  adminUsers: [],
};

export function useDashboardSettingsLive(initialSettings?: Partial<DashboardSettings>) {
  const { settings } = useStorefrontPublicState({
    settings: {
      ...FALLBACK_SETTINGS,
      ...initialSettings,
    },
  });

  return {
    ...FALLBACK_SETTINGS,
    ...settings,
  } as DashboardSettings;
}