export default function ProductLoading() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="grid lg:grid-cols-2 gap-16">
        <div className="aspect-[4/3.15] skeleton rounded-3xl" />
        <div className="space-y-4">
          <div className="h-4 w-32 skeleton rounded" />
          <div className="h-12 w-full skeleton rounded" />
          <div className="h-8 w-40 skeleton rounded" />
          <div className="h-24 w-full skeleton rounded" />
        </div>
      </div>
    </div>
  );
}