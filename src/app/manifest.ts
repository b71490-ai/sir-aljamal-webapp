import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "سر الجمال",
    short_name: "سر الجمال",
    description: "متجر عربي فاخر للعطور والجمال مع عروض يومية وتجربة شراء سريعة.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4ede3",
    theme_color: "#b88a44",
    lang: "ar",
    dir: "rtl",
  };
}