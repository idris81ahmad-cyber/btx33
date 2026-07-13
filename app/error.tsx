"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
    void import("@/lib/monitoring").then((m) =>
      m.captureException(error, { boundary: "app/error" }),
    );
  }, [error]);

  return (
    <div className="max-w-xl mx-auto px-6 py-24 text-center">
      <div className="text-xs tracking-[3px] text-[#C5A46E] mb-3">SOMETHING WENT WRONG</div>
      <h1 className="text-4xl font-semibold tracking-tight mb-4">We hit a snag</h1>
      <p className="text-[#6B5F54] mb-8">
        An unexpected error occurred. Please try again or return to the shop.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button onClick={reset} size="lg">Try again</Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/shop">Back to shop</Link>
        </Button>
      </div>
    </div>
  );
}