import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="max-w-xl mx-auto px-6 py-24 text-center">
      <div className="text-xs tracking-[3px] text-[#C5A46E] mb-3">404</div>
      <h1 className="text-5xl font-semibold tracking-tight mb-4">Page not found</h1>
      <p className="text-[#6B5F54] mb-8">
        The fabric or page you&apos;re looking for may have moved. Explore our collection instead.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button asChild size="lg">
          <Link href="/shop">Browse fabrics</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/">Go home</Link>
        </Button>
      </div>
    </div>
  );
}