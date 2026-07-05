import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
  // ESLint is now configured via .eslintrc.json
  // ignoreDuringBuilds is no longer supported in next.config.ts in newer Next.js
};

export default nextConfig;