"use client";

import { useEffect, useState } from "react";
import { getDashboardSettings, type DashboardSettings } from "@/lib/admin-storage";

const STORAGE_KEY = "sir-aljamal-admin-settings";
const SETTINGS_UPDATED_EVENT = "sir-admin-settings-updated";

const FALLBACK_SETTINGS: DashboardSettings = {
  whatsappNumber: "966500000000",
  supportEmail: "support@siraljamal.sa",
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
};

export function useDashboardSettingsLive(initialSettings?: Partial<DashboardSettings>) {
  const [settings, setSettings] = useState<DashboardSettings>({
    ...FALLBACK_SETTINGS,
    ...initialSettings,
  });

  useEffect(() => {
    const sync = () => {
      setSettings(getDashboardSettings());
    };

    sync();

    const onStorage = (event: StorageEvent) => {
      if (event.key && event.key !== STORAGE_KEY) {
        return;
      }
      sync();
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener(SETTINGS_UPDATED_EVENT, sync);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(SETTINGS_UPDATED_EVENT, sync);
    };
  }, []);

  return settings;
}