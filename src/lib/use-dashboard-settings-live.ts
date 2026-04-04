"use client";

import { useEffect, useState } from "react";
import { getDashboardSettings, type DashboardSettings } from "@/lib/admin-storage";

const STORAGE_KEY = "sir-aljamal-admin-settings";
const SETTINGS_UPDATED_EVENT = "sir-admin-settings-updated";

export function useDashboardSettingsLive() {
  const [settings, setSettings] = useState<DashboardSettings>(() => getDashboardSettings());

  useEffect(() => {
    const sync = () => {
      setSettings(getDashboardSettings());
    };

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