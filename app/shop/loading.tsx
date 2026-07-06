export default function ShopLoading() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="h-10 w-48 skeleton rounded mb-8" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-white rounded-3xl border border-[#D4C9B8] overflow-hidden">
            <div className="aspect-[4/3.2] skeleton" />
            <div className="p-5 space-y-2">
              <div className="h-3 w-20 skeleton rounded" />
              <div className="h-4 w-3/4 skeleton rounded" />
              <div className="h-6 w-1/2 mt-3 skeleton rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}