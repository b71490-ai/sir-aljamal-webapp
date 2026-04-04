"use client";

export type ProductReview = {
  id: string;
  author: string;
  rating: number;
  comment: string;
  date: string;
};

export type CustomerAddress = {
  id: string;
  label: string;
  city: string;
  details: string;
  notes?: string;
};

export type CustomerProfile = {
  name: string;
  phone: string;
  city: string;
  preferredContact: "whatsapp" | "phone";
  addresses: CustomerAddress[];
};

const WISHLIST_KEY = "sir-aljamal-wishlist";
const RECENTLY_VIEWED_KEY = "sir-aljamal-recently-viewed";
const REVIEWS_KEY = "sir-aljamal-product-reviews";
const LOYALTY_POINTS_KEY = "sir-aljamal-loyalty-points";
const CUSTOMER_PROFILE_KEY = "sir-aljamal-customer-profile";
const STOREFRONT_EVENT = "sir-aljamal-storefront-storage";

const EMPTY_CUSTOMER_PROFILE: CustomerProfile = {
  name: "",
  phone: "",
  city: "",
  preferredContact: "whatsapp",
  addresses: [],
};

function hasWindow() {
  return typeof window !== "undefined";
}

function readJson<T>(key: string, fallback: T): T {
  if (!hasWindow()) {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (!hasWindow()) {
    return;
  }
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent(STOREFRONT_EVENT, { detail: { key } }));
}

export function getStorefrontEventName() {
  return STOREFRONT_EVENT;
}

export function getWishlistIds() {
  return readJson<string[]>(WISHLIST_KEY, []);
}

export function isWishlisted(productId: string) {
  return getWishlistIds().includes(productId);
}

export function toggleWishlist(productId: string) {
  const current = getWishlistIds();
  const next = current.includes(productId)
    ? current.filter((item) => item !== productId)
    : [productId, ...current];
  writeJson(WISHLIST_KEY, next.slice(0, 60));
  return next.includes(productId);
}

export function getRecentlyViewedProductIds() {
  return readJson<string[]>(RECENTLY_VIEWED_KEY, []);
}

export function pushRecentlyViewedProduct(productId: string) {
  const current = getRecentlyViewedProductIds().filter((item) => item !== productId);
  writeJson(RECENTLY_VIEWED_KEY, [productId, ...current].slice(0, 12));
}

export function getStoredProductReviews() {
  return readJson<Record<string, ProductReview[]>>(REVIEWS_KEY, {});
}

export function getProductReviews(productId: string) {
  const reviews = getStoredProductReviews();
  return reviews[productId] || [];
}

export function addProductReview(productId: string, review: Omit<ProductReview, "id" | "date">) {
  const current = getStoredProductReviews();
  const nextReview: ProductReview = {
    ...review,
    id: `REVIEW-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    date: new Date().toISOString().slice(0, 10),
  };

  const next = {
    ...current,
    [productId]: [nextReview, ...(current[productId] || [])].slice(0, 50),
  };
  writeJson(REVIEWS_KEY, next);
  return nextReview;
}

export function getLoyaltyPoints() {
  return readJson<number>(LOYALTY_POINTS_KEY, 0);
}

export function addLoyaltyPoints(points: number) {
  const next = Math.max(0, getLoyaltyPoints() + Math.max(0, Math.round(points)));
  writeJson(LOYALTY_POINTS_KEY, next);
  return next;
}

export function getCustomerProfile() {
  const profile = readJson<CustomerProfile>(CUSTOMER_PROFILE_KEY, EMPTY_CUSTOMER_PROFILE);
  return {
    ...EMPTY_CUSTOMER_PROFILE,
    ...profile,
    addresses: Array.isArray(profile.addresses) ? profile.addresses : [],
  };
}

export function saveCustomerProfile(profile: CustomerProfile) {
  const normalized: CustomerProfile = {
    name: profile.name.trim(),
    phone: profile.phone.trim(),
    city: profile.city.trim(),
    preferredContact: profile.preferredContact === "phone" ? "phone" : "whatsapp",
    addresses: Array.isArray(profile.addresses)
      ? profile.addresses
          .map((address) => ({
            id: String(address.id || `ADDR-${Date.now()}`),
            label: String(address.label || "العنوان").trim() || "العنوان",
            city: String(address.city || "").trim(),
            details: String(address.details || "").trim(),
            notes: String(address.notes || "").trim() || undefined,
          }))
          .filter((address) => address.city && address.details)
          .slice(0, 10)
      : [],
  };

  writeJson(CUSTOMER_PROFILE_KEY, normalized);
  return normalized;
}
