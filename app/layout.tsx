import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Providers } from "./providers";
import { OrganizationJsonLd } from "@/components/seo/JsonLd";
import { absoluteUrl, siteConfig } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} | ${siteConfig.tagline} | Kwari Market Quality Delivered`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    "African textiles", "Ankara", "Lace", "Brocade", "Adire", "Shadda", "Bazin",
    "Kano fabrics", "Kwari Market", "Nigerian fashion", "BIYORA SHOP",
  ],
  authors: [{ name: siteConfig.name }],
  creator: siteConfig.name,
  alternates: { canonical: siteConfig.url },
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: `${siteConfig.name} | Premium African Textiles`,
    description: siteConfig.description,
    images: [{ url: absoluteUrl(siteConfig.ogImage), width: 1200, height: 630, alt: `${siteConfig.name} premium African textiles` }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} | Premium African Textiles`,
    description: siteConfig.description,
    images: [absoluteUrl(siteConfig.ogImage)],
  },
  robots: { index: true, follow: true },
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="antialiased bg-[#F8F4EC] text-[#2C2522]">
        <OrganizationJsonLd />
        <Providers>
          <Navbar />
          <main className="min-h-[calc(100vh-200px)]">{children}</main>
          <Footer />
          <Toaster 
            position="top-center" 
            richColors 
            closeButton 
            className="toaster"
          />
        </Providers>
      </body>
    </html>
  );
}