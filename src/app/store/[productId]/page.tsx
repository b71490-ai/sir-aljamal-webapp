import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductDetailsView from "@/components/product-details-view";
import { getProductById } from "@/data/products";
import { readServerAdminState } from "@/lib/server-admin-db";

type ProductPageProps = {
  params: Promise<{ productId: string }>;
};

async function getResolvedProduct(productId: string) {
  const state = await readServerAdminState();
  return state.products.find((item) => item.id === productId && item.isActive) || getProductById(productId) || null;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { productId } = await params;
  const product = await getResolvedProduct(productId);

  if (!product) {
    return {
      title: "المنتج غير موجود | سر الجمال",
      description: "المنتج المطلوب غير متاح حاليًا في متجر سر الجمال.",
    };
  }

  return {
    title: `${product.name} | سر الجمال`,
    description: product.shortDescription,
    openGraph: {
      title: `${product.name} | سر الجمال`,
      description: product.shortDescription,
      images: [product.imageGallery?.[0] || product.imagePath],
    },
  };
}

export default async function ProductDetailsPage({ params }: ProductPageProps) {
  const { productId } = await params;
  const product = await getResolvedProduct(productId);

  if (!product) {
    notFound();
  }

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription,
    image: product.imageGallery?.length ? product.imageGallery : [product.imagePath],
    sku: "sku" in product ? product.sku : product.id,
    brand: {
      "@type": "Brand",
      name: "سر الجمال",
    },
    offers: {
      "@type": "Offer",
      priceCurrency: "SAR",
      price: product.price,
      availability: ("stock" in product ? product.stock : 1) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://siraljamal.sa"}/store/${product.id}`,
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: product.rating,
      reviewCount: 12,
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      <ProductDetailsView productId={productId} />
    </>
  );
}
