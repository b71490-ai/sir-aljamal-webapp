import type { MetadataRoute } from "next";
import { readServerAdminState } from "@/lib/server-admin-db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://siraljamal.sa";
  const state = await readServerAdminState();
  const staticRoutes = ["", "/store", "/offers", "/categories", "/checkout", "/contact", "/policies", "/track-order", "/wishlist", "/account"];

  return [
    ...staticRoutes.map((route) => ({
      url: `${baseUrl}${route}`,
      lastModified: new Date(),
      changeFrequency: route === "" ? "daily" as const : "weekly" as const,
      priority: route === "" ? 1 : 0.7,
    })),
    ...state.products
      .filter((product) => product.isActive)
      .map((product) => ({
        url: `${baseUrl}/store/${product.id}`,
        lastModified: new Date(product.updatedAt),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
  ];
}