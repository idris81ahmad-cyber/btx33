import ProductGridSkeleton from "@/components/ProductGridSkeleton";

type Variant = "default" | "shop" | "detail" | "form" | "admin" | "home";

export default function PageSkeleton({ variant = "default" }: { variant?: Variant }) {
  if (variant === "shop") {
    return (
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="h-10 w-48 skeleton rounded mb-4" />
        <div className="h-4 w-72 skeleton rounded mb-8" />
        <div className="flex flex-wrap gap-3 mb-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-9 w-24 skeleton rounded-full" />
          ))}
        </div>
        <ProductGridSkeleton count={8} />
      </div>
    );
  }

  if (variant === "detail") {
    return (
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="h-4 w-40 skeleton rounded mb-8" />
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
          <div className="aspect-[4/3.15] skeleton rounded-3xl" />
          <div className="space-y-4">
            <div className="h-4 w-28 skeleton rounded" />
            <div className="h-10 w-full skeleton rounded" />
            <div className="h-8 w-36 skeleton rounded" />
            <div className="h-24 w-full skeleton rounded-2xl" />
            <div className="h-12 w-full skeleton rounded-2xl mt-6" />
            <div className="h-12 w-full skeleton rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (variant === "form") {
    return (
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="h-8 w-56 skeleton rounded mb-8" />
        <div className="grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7 space-y-6">
            <div className="h-48 skeleton rounded-3xl" />
            <div className="h-64 skeleton rounded-3xl" />
          </div>
          <div className="lg:col-span-5 h-80 skeleton rounded-3xl" />
        </div>
      </div>
    );
  }

  if (variant === "admin") {
    return (
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-6">
        <div className="h-8 w-64 skeleton rounded" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 skeleton rounded-2xl" />
          ))}
        </div>
        <div className="h-96 skeleton rounded-3xl" />
      </div>
    );
  }

  if (variant === "home") {
    return (
      <div>
        <div className="min-h-[70vh] skeleton" />
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="h-8 w-56 skeleton rounded mb-8" />
          <ProductGridSkeleton count={6} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-24 flex flex-col items-center gap-6">
      <div className="w-12 h-12 rounded-full border-2 border-[#D4C9B8] border-t-[#6B2D3C] animate-spin" />
      <p className="text-sm tracking-[2px] text-[#6B5F54]">LOADING BIYORA SHOP</p>
      <div className="w-full max-w-md space-y-3 mt-4">
        <div className="h-3 w-full skeleton rounded" />
        <div className="h-3 w-4/5 skeleton rounded mx-auto" />
      </div>
    </div>
  );
}
