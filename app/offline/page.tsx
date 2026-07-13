import Link from "next/link";

export const metadata = {
  title: "Offline",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <div className="max-w-md mx-auto px-6 py-20 text-center">
      <h1 className="text-2xl font-semibold mb-3">You&apos;re offline</h1>
      <p className="text-[#6B5F54] text-sm mb-6 leading-relaxed">
        BIYORA SHOP needs a connection for checkout and live catalogue updates.
        Your cart is saved on this device and will be available when you&apos;re back online.
      </p>
      <Link href="/" className="btn-primary inline-block px-8 py-3">
        Try home page
      </Link>
    </div>
  );
}
