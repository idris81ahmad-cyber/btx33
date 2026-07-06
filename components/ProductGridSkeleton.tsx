export default function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-3xl border border-[#D4C9B8] overflow-hidden">
          <div className="aspect-[4/3.2] skeleton fabric-texture" />
          <div className="p-5 space-y-3">
            <div className="h-3 w-24 skeleton rounded" />
            <div className="h-5 w-4/5 skeleton rounded" />
            <div className="h-7 w-28 skeleton rounded mt-2" />
            <div className="h-10 w-full skeleton rounded-2xl mt-4" />
          </div>
        </div>
      ))}
    </div>
  );
}