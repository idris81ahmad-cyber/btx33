import type { MetadataRoute } from "next";
import { getProducts } from "@/lib/products-store";
import { fabricCategories } from "@/lib/products";
import { absoluteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages = [
    "",
    "/shop",
    "/about",
    "/contact",
    "/faq",
    "/cart",
  ].map((path) => ({
    url: absoluteUrl(path),
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.8,
  }));

  const categoryPages = fabricCategories.map((category) => ({
    url: absoluteUrl(`/shop?category=${encodeURIComponent(category)}`),
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  let productPages: MetadataRoute.Sitemap = [];
  try {
    const products = await getProducts();
    productPages = products.map((product) => ({
      url: absoluteUrl(`/products/${product.slug}`),
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    }));
  } catch {
    // Fallback when storage unavailable at build time
  }

  return [...staticPages, ...categoryPages, ...productPages];
}