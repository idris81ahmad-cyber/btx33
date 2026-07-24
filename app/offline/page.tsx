import Link from "next/link";

export const metadata = {
  title: "Offline",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <div className="max-w-md mx-auto px-6 py-20 text-center">
      <p className="text-[11px] tracking-[0.25em] text-[#C5A46E] font-medium mb-3">
        OFFLINE MODE
      </p>
      <h1 className="text-2xl font-semibold mb-3">You&apos;re offline</h1>
      <p className="text-[#6B5F54] text-sm mb-4 leading-relaxed">
        Checkout and live catalogue need a connection. Good news:{" "}
        <strong className="text-[#2C2522]">your cart is saved on this device</strong> and will
        reappear when you&apos;re back online.
      </p>
      <div className="rounded-2xl border border-[#E8DFD0] bg-[#FBF8F3] px-4 py-3 text-xs text-[#6B5F54] mb-6 text-left">
        Tip: open the cart icon once you reconnect — items persist via local storage / PWA.
      </div>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/" className="btn-primary inline-block px-8 py-3">
          Try home page
        </Link>
        <Link
          href="/cart"
          className="inline-flex items-center justify-center px-8 py-3 rounded-2xl border border-[#D4C9B8] text-sm font-medium"
        >
          Open cart
        </Link>
      </div>
    </div>
  );
}
