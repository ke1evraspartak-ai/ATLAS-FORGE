import { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://your-domain.com";

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      priority: 1,
    },
    {
      url: `${baseUrl}/catalog`,
      lastModified: new Date(),
      priority: 0.9,
    },
  ];

  const { data: sections } = await supabase
    .from("catalog_sections")
    .select("*");

  const sectionPages: MetadataRoute.Sitemap =
    sections?.map((section) => ({
      url: `${baseUrl}/catalog/sections/${section.slug}`,
      lastModified: new Date(section.updated_at || Date.now()),
      priority: 0.8,
    })) || [];

  const { data: products } = await supabase
    .from("products")
    .select("*");

  const productPages: MetadataRoute.Sitemap =
    products?.map((product) => ({
      url: `${baseUrl}/catalog/${product.slug || product.id}`,
      lastModified: new Date(product.updated_at || Date.now()),
      priority: 0.7,
    })) || [];

  return [
    ...staticPages,
    ...sectionPages,
    ...productPages,
  ];
}