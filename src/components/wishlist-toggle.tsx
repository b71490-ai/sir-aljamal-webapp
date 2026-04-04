"use client";

import { useEffect, useState } from "react";
import {
  getStorefrontEventName,
  isWishlisted,
  toggleWishlist,
} from "@/lib/storefront-storage";

type WishlistToggleProps = {
  productId: string;
  className?: string;
};

export default function WishlistToggle({ productId, className }: WishlistToggleProps) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const sync = () => setActive(isWishlisted(productId));
    sync();
    window.addEventListener(getStorefrontEventName(), sync);
    return () => window.removeEventListener(getStorefrontEventName(), sync);
  }, [productId]);

  return (
    <button
      className={className}
      type="button"
      onClick={() => setActive(toggleWishlist(productId))}
      aria-pressed={active}
    >
      {active ? "في المفضلة" : "أضيفي للمفضلة"}
    </button>
  );
}
