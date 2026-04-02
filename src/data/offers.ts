import { PRODUCTS, type ProductCategory } from "@/data/products";

export type OfferRule = {
  minSubtotal?: number;
  category?: ProductCategory;
  productIds?: string[];
};

export type Offer = {
  id: string;
  title: string;
  details: string;
  expiresAt: string;
  href: string;
  badge: string;
  rule: OfferRule;
  discountPercent?: number;
  discountFixed?: number;
  freeShipping?: boolean;
  couponCode?: string;
};

export type CartLineForOffer = {
  productId: string;
  quantity: number;
  unitPrice: number;
  category: ProductCategory;
};

export const OFFERS: Offer[] = [
  {
    id: "welcome-35",
    title: "خصم 35% على مختارات البشرة",
    details: "خصم تلقائي على منتجات العناية بالبشرة حتى نهاية اليوم.",
    expiresAt: "2026-12-31T21:59:59.000Z",
    href: "/store?category=skin-care",
    badge: "عرض تلقائي",
    rule: { category: "skin-care", minSubtotal: 80 },
    discountPercent: 35,
  },
  {
    id: "makeup-bundle",
    title: "خصم 25% على المكياج",
    details: "عند شراء أي منتجين من قسم المكياج يتم تطبيق خصم تلقائي.",
    expiresAt: "2026-12-30T21:59:59.000Z",
    href: "/store?category=makeup",
    badge: "لفترة محدودة",
    rule: { category: "makeup" },
    discountPercent: 25,
  },
  {
    id: "free-shipping-79",
    title: "شحن مجاني فوق 79 ر.س",
    details: "الشحن يصبح مجانيًا تلقائيًا عند تجاوز الحد الأدنى.",
    expiresAt: "2026-12-31T21:59:59.000Z",
    href: "/checkout",
    badge: "مباشر",
    rule: { minSubtotal: 79 },
    freeShipping: true,
  },
  {
    id: "coupon-glow10",
    title: "كود GLOW10",
    details: "خصم 10% على كامل السلة باستخدام الكود.",
    expiresAt: "2026-12-31T21:59:59.000Z",
    href: "/checkout",
    badge: "كوبون",
    rule: { minSubtotal: 120 },
    discountPercent: 10,
    couponCode: "GLOW10",
  },
];

export function getActiveOffers(now = new Date()): Offer[] {
  const ts = now.getTime();
  return OFFERS.filter((offer) => Number(new Date(offer.expiresAt)) > ts);
}

export function getSecondsLeft(expiresAt: string, now = new Date()): number {
  const diff = Number(new Date(expiresAt)) - now.getTime();
  return Math.max(0, Math.floor(diff / 1000));
}

function matchesRule(lines: CartLineForOffer[], subtotal: number, rule: OfferRule): boolean {
  if (rule.minSubtotal && subtotal < rule.minSubtotal) {
    return false;
  }

  if (rule.category) {
    const hasCategoryLine = lines.some((line) => line.category === rule.category);
    if (!hasCategoryLine) {
      return false;
    }
  }

  if (rule.productIds && rule.productIds.length > 0) {
    const set = new Set(rule.productIds);
    const hasAny = lines.some((line) => set.has(line.productId));
    if (!hasAny) {
      return false;
    }
  }

  return true;
}

export function calculateAutoOfferDiscount(lines: CartLineForOffer[], subtotal: number): {
  discount: number;
  offer: Offer | null;
  freeShipping: boolean;
} {
  const active = getActiveOffers();
  const discountCandidates = active
    .filter((offer) => matchesRule(lines, subtotal, offer.rule))
    .map((offer) => {
      const percentValue = offer.discountPercent ? (subtotal * offer.discountPercent) / 100 : 0;
      const fixedValue = offer.discountFixed ?? 0;
      const totalDiscount = Math.max(percentValue, fixedValue);
      return { offer, totalDiscount };
    })
    .sort((a, b) => b.totalDiscount - a.totalDiscount);

  const bestDiscount = discountCandidates[0] ?? null;
  const freeShipping = active.some((offer) => offer.freeShipping && matchesRule(lines, subtotal, offer.rule));

  return {
    discount: bestDiscount ? Math.round(bestDiscount.totalDiscount) : 0,
    offer: bestDiscount?.offer ?? null,
    freeShipping,
  };
}

export function findCouponOffer(code: string): Offer | null {
  const normalized = code.trim().toUpperCase();
  const active = getActiveOffers();
  return active.find((offer) => offer.couponCode === normalized) ?? null;
}

export function getFeaturedOfferProducts(limit = 4) {
  const activeOffers = getActiveOffers();
  const categories = activeOffers.map((offer) => offer.rule.category).filter(Boolean) as ProductCategory[];
  const featured = PRODUCTS.filter((product) => categories.includes(product.category));
  return featured.slice(0, limit);
}
