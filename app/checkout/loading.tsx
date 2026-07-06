export default function CheckoutLoading() {
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