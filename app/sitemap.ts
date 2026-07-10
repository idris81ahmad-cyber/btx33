import type { MetadataRoute } from "next";
import { getProducts } from "@/lib/products-store";
import { fabricCategories, products as defaultProducts } from "@/lib/products";
import { absoluteUrl } from "@/lib/site";

// Avoid build-time static generation — external Blob/GitHub fetches can exceed 60s
export const dynamic = "force-dynamic";
export const revalidate = 3600;

async function getProductsForSitemap() {
  try {
    return await Promise.race([
      getProducts(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("sitemap product fetch timeout")), 8_000),
      ),
    ]);
  } catch {
    return defaultProducts;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages = [
    "",
    "/shop",
    "/about",
    "/journal",
    "/journal/fabric-care",
    "/journal/choosing-lace",
    "/journal/styling-tips",
    "/journal/meet-artisans",
    "/calculator",
    "/wholesale",
    "/contact",
    "/faq",
    "/cart",
    "/login",
    "/signup",
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

  const products = await getProductsForSitemap();
  const productPages = products.map((product) => ({
    url: absoluteUrl(`/products/${product.slug}`),
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  return [...staticPages, ...categoryPages, ...productPages];
}