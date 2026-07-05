import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Providers } from "./providers";

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
  title: "BIYORA SHOP | Premium African Textiles | Kwari Market Quality Delivered",
  description: "Discover curated premium African textiles and fabrics from the heart of Kano's Kantin Kwari Market. Luxury Ankara, Lace, Brocade, Adire & more. Worldwide delivery with exceptional quality.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="antialiased bg-[#F8F4EC] text-[#2C2522]">
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