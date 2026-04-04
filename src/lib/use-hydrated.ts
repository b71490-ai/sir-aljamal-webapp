"use client";

import { useSyncExternalStore } from "react";

let didHydrate = false;

export function useHydrated() {
  return useSyncExternalStore(
    (onStoreChange) => {
      if (didHydrate) {
        return () => {};
      }

      const id = window.requestAnimationFrame(() => {
        didHydrate = true;
        onStoreChange();
      });

      return () => window.cancelAnimationFrame(id);
    },
    () => didHydrate,
    () => false,
  );
}