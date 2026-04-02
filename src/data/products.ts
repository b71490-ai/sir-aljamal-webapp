export type ProductCategory = "skin-care" | "hair-care" | "makeup" | "fragrance";

export type Product = {
  id: string;
  name: string;
  category: ProductCategory;
  categoryLabel: string;
  imagePath: string;
  imageAlt: string;
  price: number;
  badge: string;
  rating: number;
  shortDescription: string;
  benefits: string[];
};

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  "skin-care": "العناية بالبشرة",
  "hair-care": "العناية بالشعر",
  makeup: "المكياج",
  fragrance: "العطور",
};

export const PRODUCTS: Product[] = [
  {
    id: "vitamin-c-serum",
    name: "سيروم فيتامين C",
    category: "skin-care",
    categoryLabel: CATEGORY_LABELS["skin-care"],
    imagePath: "/products/vitamin-c-serum.svg",
    imageAlt: "عبوة سيروم فيتامين سي للعناية بالبشرة",
    price: 129,
    badge: "الأكثر مبيعًا",
    rating: 4.9,
    shortDescription: "إشراقة يومية وتوحيد لون البشرة بتركيبة خفيفة.",
    benefits: [
      "تفتيح مظهر البشرة الباهتة",
      "تقليل مظهر البقع الداكنة تدريجيًا",
      "مناسب للاستخدام اليومي صباحًا",
    ],
  },
  {
    id: "intense-hair-mask",
    name: "ماسك ترطيب مكثف",
    category: "hair-care",
    categoryLabel: CATEGORY_LABELS["hair-care"],
    imagePath: "/products/intense-hair-mask.svg",
    imageAlt: "عبوة ماسك ترطيب للشعر",
    price: 89,
    badge: "عرض اليوم",
    rating: 4.8,
    shortDescription: "ترطيب عميق للشعر الجاف والمتقصف مع نعومة ملحوظة.",
    benefits: [
      "تقليل الهيشان بعد أول استخدام",
      "زيادة النعومة والمرونة",
      "آمن للشعر المصبوغ",
    ],
  },
  {
    id: "soft-touch-foundation",
    name: "فاونديشن ناعم",
    category: "makeup",
    categoryLabel: CATEGORY_LABELS.makeup,
    imagePath: "/products/soft-touch-foundation.svg",
    imageAlt: "عبوة فاونديشن للمكياج اليومي",
    price: 149,
    badge: "جديد",
    rating: 4.7,
    shortDescription: "تغطية طبيعية قابلة للبناء مع لمسة نهائية مخملية.",
    benefits: [
      "ثبات طويل طوال اليوم",
      "قوام خفيف لا يسد المسام",
      "يندمج بسهولة مع البشرة",
    ],
  },
  {
    id: "signature-fragrance",
    name: "عطر لمسة فاخرة",
    category: "fragrance",
    categoryLabel: CATEGORY_LABELS.fragrance,
    imagePath: "/products/signature-fragrance.svg",
    imageAlt: "زجاجة عطر لمسة فاخرة",
    price: 199,
    badge: "شحن مجاني",
    rating: 4.9,
    shortDescription: "رائحة راقية بثبات عالٍ ولمسة عصرية.",
    benefits: [
      "ثبات يدوم لساعات طويلة",
      "مناسب للمناسبات والاستخدام اليومي",
      "تركيبة متوازنة غير مزعجة",
    ],
  },
  {
    id: "daily-bright-cream",
    name: "كريم تفتيح يومي",
    category: "skin-care",
    categoryLabel: CATEGORY_LABELS["skin-care"],
    imagePath: "/products/daily-bright-cream.svg",
    imageAlt: "عبوة كريم تفتيح يومي للبشرة",
    price: 109,
    badge: "خصم 20%",
    rating: 4.6,
    shortDescription: "ترطيب وتفتيح لطيف يمنح البشرة مظهرًا صحيًا.",
    benefits: [
      "يدعم توحيد المظهر العام للبشرة",
      "ترطيب متوازن بدون لمعان زائد",
      "مثالي تحت المكياج",
    ],
  },
  {
    id: "repair-hair-oil",
    name: "زيت إصلاح الشعر",
    category: "hair-care",
    categoryLabel: CATEGORY_LABELS["hair-care"],
    imagePath: "/products/repair-hair-oil.svg",
    imageAlt: "عبوة زيت إصلاح الشعر",
    price: 99,
    badge: "لفترة محدودة",
    rating: 4.8,
    shortDescription: "عناية مركزة لأطراف الشعر وحماية من التقصف.",
    benefits: [
      "تقليل مظهر الأطراف المتقصفة",
      "إضافة لمعان طبيعي للشعر",
      "يمتص بسرعة بدون دهون",
    ],
  },
];

export function getProductById(productId: string) {
  return PRODUCTS.find((product) => product.id === productId);
}
