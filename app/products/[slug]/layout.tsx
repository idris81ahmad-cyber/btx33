import type { Metadata } from "next";
import { getProducts } from "@/lib/products-store";

export const dynamic = "force-dynamic";
import { absoluteUrl, siteConfig } from "@/lib/site";
import { ProductJsonLd, BreadcrumbJsonLd } from "@/components/seo/JsonLd";

interface Props {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const products = await getProducts();
  const product = products.find((p) => p.slug === slug);

  if (!product) {
    return { title: "Product Not Found | BIYORA SHOP" };
  }

  const title = `${product.name} | ${product.category} | BIYORA SHOP`;
  const description = product.shortDescription;
  const image = product.images[0]?.startsWith("http")
    ? product.images[0]
    : absoluteUrl(product.images[0] ?? siteConfig.ogImage);
  const url = absoluteUrl(`/products/${slug}`);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title,
      description,
      siteName: siteConfig.name,
      images: [{ url: image, width: 1200, height: 630, alt: product.name }],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function ProductLayout({ children, params }: Props) {
  const { slug } = await params;
  const products = await getProducts();
  const product = products.find((p) => p.slug === slug);

  return (
    <>
      {product && (
        <>
          <ProductJsonLd product={product} url={absoluteUrl(`/products/${slug}`)} />
          <BreadcrumbJsonLd
            items={[
              { name: "Home", href: "/" },
              { name: "Shop", href: "/shop" },
              { name: product.category, href: `/shop?category=${encodeURIComponent(product.category)}` },
              { name: product.name, href: `/products/${slug}` },
            ]}
          />
        </>
      )}
      {children}
    </>
  );
}