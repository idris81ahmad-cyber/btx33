"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Headphones,
  MapPin,
  Package,
  RefreshCw,
  ShoppingBag,
  Truck,
} from "lucide-react";
import {
  ORDER_STATUSES,
  orderStatusClass,
  orderStatusLabel,
} from "@/lib/order-status";
import OrderDeliveryTimeline from "@/components/OrderDeliveryTimeline";
import ProductImage from "@/components/ProductImage";
import type { ShippingJson } from "@/lib/db/schema";
import type { Product } from "@/types/product";
import { useCartStore } from "@/lib/cart-store";
import { useUIStore } from "@/lib/ui-store";
import { cn } from "@/lib/utils";

interface OrderItem {
  productId?: number;
  name: string;
  slug?: string;
  category?: string;
  image?: string;
  quantity: number;
  selectedLength?: string;
  lineTotal?: number;
  unitPrice?: number;
}

interface StatusHistoryEvent {
  id?: number;
  fromStatus?: string | null;
  toStatus: string;
  note?: string | null;
  actor?: string;
  createdAt: string;
}

interface CustomerOrder {
  orderNumber: string;
  total: number;
  subtotal?: number;
  shippingFee?: number;
  discount?: number;
  status: string;
  createdAt: string;
  phone?: string;
  paymentMethod?: string;
  couponCode?: string | null;
  items: OrderItem[];
  shipping?: ShippingJson;
  statusHistory?: StatusHistoryEvent[];
}

/** Filters emphasized for delivery UX */
const FILTER_STATUSES = [
  "all",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "confirmed",
  "pending",
] as const;

function formatShipping(shipping?: ShippingJson): string[] | null {
  if (!shipping) return null;
  const lines = [
    shipping.fullName,
    shipping.phone,
    shipping.address,
    [shipping.city, shipping.state, shipping.postalCode].filter(Boolean).join(", "),
    shipping.country || "Nigeria",
  ].filter(Boolean) as string[];
  return lines.length ? lines : null;
}

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function OrdersSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-5 sm:px-6 py-12 pb-28 space-y-6" aria-busy="true">
      <div className="space-y-3">
        <div className="h-3 w-28 skeleton rounded" />
        <div className="h-9 w-56 skeleton rounded" />
        <div className="h-4 w-72 skeleton rounded" />
      </div>
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-9 w-24 shrink-0 skeleton rounded-full" />
        ))}
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="rounded-3xl border border-[#E8DFD0] bg-white p-6 space-y-4 shadow-sm"
        >
          <div className="flex justify-between gap-4">
            <div className="space-y-2 flex-1">
              <div className="h-3 w-20 skeleton rounded" />
              <div className="h-5 w-48 skeleton rounded" />
              <div className="h-3 w-32 skeleton rounded" />
            </div>
            <div className="h-7 w-24 skeleton rounded-full" />
          </div>
          <div className="h-16 skeleton rounded-2xl" />
          <div className="h-12 skeleton rounded-xl" />
          <div className="flex gap-2">
            <div className="h-11 flex-1 skeleton rounded-2xl" />
            <div className="h-11 flex-1 skeleton rounded-2xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function OrderHistoryPage() {
  const { status } = useSession();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [accountEmail, setAccountEmail] = useState<string | null>(null);

  const loadOrders = useCallback(() => {
    if (status !== "authenticated") return;
    setLoading(true);
    setError("");
    fetch("/api/account/orders", {
      credentials: "include",
      cache: "no-store",
      headers: { "Cache-Control": "no-cache" },
    })
      .then(async (r) => {
        if (r.status === 401) {
          throw new Error("Your session expired. Please sign in again.");
        }
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          throw new Error(
            typeof body?.error === "string" ? body.error : "Could not load orders",
          );
        }
        return r.json();
      })
      .then((d) => {
        setOrders(Array.isArray(d.orders) ? d.orders : []);
        if (d?.meta?.email) setAccountEmail(String(d.meta.email));
      })
      .catch((err: unknown) =>
        setError(
          err instanceof Error
            ? err.message
            : "We could not load your orders. Please check your connection and try again.",
        ),
      )
      .finally(() => setLoading(false));
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated") {
      if (status !== "loading") setLoading(false);
      return;
    }
    loadOrders();
  }, [status, loadOrders]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: orders.length };
    for (const s of ORDER_STATUSES) c[s] = 0;
    for (const o of orders) c[o.status] = (c[o.status] || 0) + 1;
    return c;
  }, [orders]);

  const filtered = useMemo(() => {
    if (filter === "all") return orders;
    return orders.filter((o) => o.status === filter);
  }, [orders, filter]);

  const copyOrderNumber = async (orderNumber: string) => {
    try {
      await navigator.clipboard.writeText(orderNumber);
      setCopiedId(orderNumber);
      toast.success("Order number copied", {
        description: orderNumber,
      });
      window.setTimeout(() => setCopiedId((id) => (id === orderNumber ? null : id)), 2000);
    } catch {
      toast.error("Could not copy — long-press to select the number");
    }
  };

  const reorder = (order: CustomerOrder) => {
    const { addToCart } = useCartStore.getState();
    const { setCartDrawerOpen } = useUIStore.getState();
    let added = 0;

    for (const item of order.items || []) {
      const length = item.selectedLength || "5 yards";
      const unit = item.unitPrice ?? (item.lineTotal && item.quantity
        ? Math.round(item.lineTotal / item.quantity)
        : 0);
      const product = {
        id: item.productId ?? 0,
        slug: item.slug || `reorder-${item.name}`,
        name: item.name,
        category: item.category || "Fabric",
        price: unit || 0,
        images: item.image ? [item.image] : ["/images/ankara-premium.jpg"],
        rating: 4.5,
        reviewCount: 0,
        shortDescription: "",
        description: "",
        inStock: 99,
        colorFamily: "",
        patternStyle: "",
        lengthOptions: [length],
        specifications: {},
      } as Product;

      const qty = Math.max(1, item.quantity || 1);
      for (let i = 0; i < qty; i++) {
        addToCart(product, length);
        added += 1;
      }
    }

    if (added === 0) {
      toast.error("No items to reorder");
      return;
    }

    toast.success("Added to cart", {
      description: `${added} piece(s) from ${order.orderNumber} are ready in your bag.`,
      action: {
        label: "View cart",
        onClick: () => setCartDrawerOpen(true),
      },
    });
    setCartDrawerOpen(true);
  };

  if (status === "loading" || (status === "authenticated" && loading)) {
    return <OrdersSkeleton />;
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-6 py-16">
        <div className="max-w-md w-full text-center">
          <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-gradient-to-br from-[#6B2D3C]/10 to-[#C5A46E]/20 border border-[#D4C9B8] flex items-center justify-center">
            <Package className="w-9 h-9 text-[#6B2D3C]" aria-hidden="true" />
          </div>
          <p className="text-[11px] tracking-[0.25em] text-[#C5A46E] font-medium mb-3">
            BIYORA ACCOUNT
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#2C2522] mb-3">
            Sign in to track orders
          </h1>
          <p className="text-[#6B5F54] text-sm leading-relaxed mb-8">
            View delivery progress, shipping details, and reorder your favourite Kwari fabrics anytime.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/login?callbackUrl=/account/orders"
              className="btn-primary inline-flex items-center justify-center px-8 py-3.5 rounded-2xl min-h-[48px] text-sm font-medium"
            >
              Sign in
            </Link>
            <Link
              href="/signup?callbackUrl=/account/orders"
              className="inline-flex items-center justify-center px-8 py-3.5 rounded-2xl border border-[#D4C9B8] bg-white text-sm font-medium min-h-[48px] hover:border-[#6B2D3C]/40 transition"
            >
              Create account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[70vh] pb-28">
      {/* Soft luxury background wash */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-[#6B2D3C]/[0.04] via-transparent to-transparent"
        aria-hidden="true"
      />

      <div className="relative max-w-3xl mx-auto px-5 sm:px-6 py-10 sm:py-14">
        {/* Header */}
        <header className="mb-8 sm:mb-10">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="text-[11px] tracking-[0.28em] text-[#C5A46E] font-medium mb-2">
                MY ACCOUNT
              </p>
              <h1 className="text-3xl sm:text-4xl md:text-[2.75rem] font-semibold tracking-tight text-[#2C2522] leading-none">
                Order history
              </h1>
              <p className="mt-3 text-sm text-[#6B5F54] max-w-md leading-relaxed">
                Follow every piece from confirmation through packing to your door.
                {accountEmail ? (
                  <span className="block mt-1 text-xs text-[#8A7E72]">
                    Signed in as {accountEmail}
                  </span>
                ) : null}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={loadOrders}
                className="inline-flex items-center gap-2 text-sm px-4 py-2.5 rounded-2xl border border-[#D4C9B8] bg-white/80 hover:bg-white hover:border-[#C5A46E]/60 transition min-h-[44px] shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                Refresh
              </button>
              <Link
                href="/account"
                className="text-sm text-[#6B2D3C] font-medium underline-offset-4 hover:underline px-2 py-2"
              >
                Account
              </Link>
            </div>
          </div>
        </header>

        {/* Filter chips */}
        <div
          className="flex gap-2 overflow-x-auto pb-2 mb-8 -mx-1 px-1 scrollbar-thin"
          role="tablist"
          aria-label="Filter by order status"
        >
          {FILTER_STATUSES.map((key) => {
            const count = key === "all" ? counts.all : counts[key] || 0;
            // Always show primary filters; hide zero-count secondary ones except always-show set
            const always =
              key === "all" ||
              key === "processing" ||
              key === "shipped" ||
              key === "delivered" ||
              key === "cancelled";
            if (!always && count === 0) return null;

            const label =
              key === "all"
                ? "All"
                : orderStatusLabel(key).replace("Order ", "").replace("Awaiting payment", "Pending");

            return (
              <FilterChip
                key={key}
                active={filter === key}
                onClick={() => setFilter(key)}
                label={label}
                count={count}
              />
            );
          })}
        </div>

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="mb-8 rounded-3xl border border-amber-200/80 bg-gradient-to-br from-amber-50 to-[#F8F4EC] p-5 sm:p-6 shadow-sm"
          >
            <p className="font-medium text-amber-950 text-sm">{error}</p>
            <button
              type="button"
              onClick={loadOrders}
              className="mt-3 text-sm font-medium text-[#6B2D3C] underline underline-offset-2 min-h-[44px]"
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty */}
        {orders.length === 0 && !error ? (
          <EmptyOrdersState accountEmail={accountEmail} />
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#D4C9B8] bg-white/60 px-6 py-16 text-center">
            <p className="text-[#6B5F54] text-sm mb-4">No orders match this filter.</p>
            <button
              type="button"
              onClick={() => setFilter("all")}
              className="text-sm font-medium text-[#6B2D3C] underline underline-offset-2 min-h-[44px]"
            >
              Show all orders
            </button>
          </div>
        ) : (
          <ul className="space-y-5 sm:space-y-6" aria-label="Your orders">
            {filtered.map((order) => {
              const itemsOpen = expandedItems[order.orderNumber] ?? (order.items?.length || 0) <= 3;
              const shipLines = formatShipping(order.shipping);
              const itemCount = order.items?.length || 0;

              return (
                <li key={order.orderNumber}>
                  <article
                    className={cn(
                      "group relative overflow-hidden rounded-3xl border border-[#E8DFD0] bg-white",
                      "shadow-[0_4px_24px_-8px_rgba(44,37,34,0.12)]",
                      "hover:shadow-[0_12px_40px_-12px_rgba(107,45,60,0.18)]",
                      "hover:border-[#D4C9B8] transition-all duration-300",
                    )}
                  >
                    {/* Gold accent rail */}
                    <div
                      className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#C5A46E] via-[#6B2D3C] to-[#C5A46E]/40 opacity-80"
                      aria-hidden="true"
                    />

                    <div className="pl-5 sm:pl-6 pr-5 sm:pr-6 pt-5 sm:pt-6 pb-5 sm:pb-6">
                      {/* Top row */}
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="min-w-0 space-y-1.5">
                          <p className="text-[10px] uppercase tracking-[0.2em] text-[#A89B8A] font-medium">
                            Order reference
                          </p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-mono text-sm sm:text-base font-semibold text-[#2C2522] tracking-tight break-all">
                              {order.orderNumber}
                            </p>
                            <button
                              type="button"
                              onClick={() => void copyOrderNumber(order.orderNumber)}
                              className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-[#E8DFD0] bg-[#F8F4EC]/80 hover:bg-[#F1EDE4] hover:border-[#C5A46E]/50 transition min-h-[36px]"
                              aria-label={`Copy order number ${order.orderNumber}`}
                            >
                              {copiedId === order.orderNumber ? (
                                <Check className="w-3.5 h-3.5 text-emerald-700" />
                              ) : (
                                <Copy className="w-3.5 h-3.5 text-[#6B5F54]" />
                              )}
                            </button>
                          </div>
                          <p className="text-xs text-[#6B5F54]">
                            Placed {formatDate(order.createdAt)}
                          </p>
                        </div>

                        <div className="flex flex-row sm:flex-col items-center sm:items-end gap-3 sm:gap-2">
                          <span
                            className={cn(
                              "inline-flex px-3 py-1.5 rounded-full text-xs font-semibold border shadow-sm",
                              orderStatusClass(order.status),
                            )}
                          >
                            {orderStatusLabel(order.status)}
                          </span>
                          <p className="text-xl sm:text-2xl font-semibold tabular-nums tracking-tight text-[#2C2522]">
                            ₦{(order.total ?? 0).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {/* Timeline */}
                      <div className="mt-6 rounded-2xl border border-[#F0E9DC] bg-gradient-to-br from-[#FBF8F3] to-white p-4 sm:p-5">
                        <OrderDeliveryTimeline
                          status={order.status}
                          history={order.statusHistory}
                        />
                      </div>

                      {/* Items */}
                      {itemCount > 0 && (
                        <div className="mt-5">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-[10px] uppercase tracking-[0.18em] text-[#A89B8A] font-medium">
                              Fabrics · {itemCount}
                            </h3>
                            {itemCount > 3 && (
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedItems((prev) => ({
                                    ...prev,
                                    [order.orderNumber]: !itemsOpen,
                                  }))
                                }
                                className="inline-flex items-center gap-1 text-xs font-medium text-[#6B2D3C] min-h-[40px]"
                                aria-expanded={itemsOpen}
                              >
                                {itemsOpen ? (
                                  <>
                                    Show less <ChevronUp className="w-3.5 h-3.5" />
                                  </>
                                ) : (
                                  <>
                                    Show all <ChevronDown className="w-3.5 h-3.5" />
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                          <ul className="divide-y divide-[#F0E9DC] rounded-2xl border border-[#F0E9DC] overflow-hidden bg-white">
                            {(itemsOpen ? order.items : order.items.slice(0, 3)).map(
                              (item, idx) => (
                                <li
                                  key={`${order.orderNumber}-item-${idx}`}
                                  className="flex items-start justify-between gap-3 px-4 py-3.5 text-sm"
                                >
                                  <div className="flex items-start gap-3 min-w-0 flex-1">
                                    <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden border border-[#F0E9DC] shrink-0 bg-[#F8F4EC]">
                                      <ProductImage
                                        src={item.image || "/images/ankara-premium.jpg"}
                                        alt={item.name}
                                        fill
                                        sizes="56px"
                                      />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="font-medium text-[#2C2522] leading-snug">
                                        {item.name}
                                      </p>
                                      <p className="text-xs text-[#6B5F54] mt-0.5">
                                        {item.selectedLength || "Standard length"} · Qty{" "}
                                        {item.quantity}
                                      </p>
                                    </div>
                                  </div>
                                  {typeof item.lineTotal === "number" && (
                                    <p className="tabular-nums font-medium text-[#2C2522] shrink-0">
                                      ₦{item.lineTotal.toLocaleString()}
                                    </p>
                                  )}
                                </li>
                              ),
                            )}
                          </ul>
                          {!itemsOpen && itemCount > 3 && (
                            <p className="text-[11px] text-[#A89B8A] mt-2 px-1">
                              +{itemCount - 3} more fabric{itemCount - 3 === 1 ? "" : "s"}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Shipping summary */}
                      {shipLines && (
                        <div className="mt-5 flex gap-3 rounded-2xl bg-[#F8F4EC]/80 border border-[#EFE7DA] px-4 py-3.5">
                          <MapPin
                            className="w-4 h-4 text-[#C5A46E] shrink-0 mt-0.5"
                            aria-hidden="true"
                          />
                          <div className="min-w-0 text-sm">
                            <p className="text-[10px] uppercase tracking-[0.15em] text-[#A89B8A] mb-1">
                              Deliver to
                            </p>
                            <p className="text-[#2C2522] font-medium leading-snug">
                              {shipLines[0]}
                            </p>
                            <p className="text-xs text-[#6B5F54] mt-0.5 leading-relaxed line-clamp-2">
                              {shipLines.slice(1).join(" · ")}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
                        <button
                          type="button"
                          onClick={() => reorder(order)}
                          className="flex-1 inline-flex items-center justify-center gap-2 min-h-[48px] rounded-2xl bg-[#6B2D3C] text-white text-sm font-medium shadow-md shadow-[#6B2D3C]/20 hover:bg-[#5a2532] active:scale-[0.98] transition"
                        >
                          <ShoppingBag className="w-4 h-4" aria-hidden="true" />
                          Reorder
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            toast.message("Tracking coming soon", {
                              description:
                                "Live courier tracking will appear here. Your status timeline above is always up to date.",
                            })
                          }
                          className="flex-1 inline-flex items-center justify-center gap-2 min-h-[48px] rounded-2xl border border-[#D4C9B8] bg-white text-sm font-medium text-[#2C2522] hover:border-[#C5A46E]/70 hover:bg-[#FBF8F3] active:scale-[0.98] transition"
                        >
                          <Truck className="w-4 h-4 text-[#6B2D3C]" aria-hidden="true" />
                          Track delivery
                        </button>
                        <Link
                          href={`/contact?order=${encodeURIComponent(order.orderNumber)}&subject=${encodeURIComponent(`Order support — ${order.orderNumber}`)}`}
                          className="flex-1 inline-flex items-center justify-center gap-2 min-h-[48px] rounded-2xl border border-[#E8DFD0] text-sm font-medium text-[#6B5F54] hover:text-[#6B2D3C] hover:border-[#D4C9B8] hover:bg-white active:scale-[0.98] transition"
                        >
                          <Headphones className="w-4 h-4" aria-hidden="true" />
                          Support
                        </Link>
                      </div>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold border transition min-h-[40px]",
        active
          ? "bg-[#6B2D3C] text-white border-[#6B2D3C] shadow-md shadow-[#6B2D3C]/25"
          : "bg-white/90 text-[#6B5F54] border-[#E0D6C6] hover:border-[#C5A46E]/60 hover:text-[#2C2522] hover:bg-white",
      )}
    >
      {label}
      <span
        className={cn(
          "tabular-nums text-[10px] px-1.5 py-0.5 rounded-full font-medium",
          active ? "bg-white/20 text-white" : "bg-[#F8F4EC] text-[#6B5F54]",
        )}
      >
        {count}
      </span>
    </button>
  );
}

function EmptyOrdersState({ accountEmail }: { accountEmail?: string | null }) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-[#E8DFD0] bg-gradient-to-b from-white via-[#FBF8F3] to-[#F8F4EC] px-6 py-16 sm:py-20 text-center shadow-[0_8px_40px_-16px_rgba(44,37,34,0.15)]">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(197,164,110,0.25), transparent 45%), radial-gradient(circle at 80% 70%, rgba(107,45,60,0.12), transparent 40%)",
        }}
        aria-hidden="true"
      />
      <div className="relative">
        <div className="mx-auto mb-6 w-24 h-24 rounded-full border border-[#E8DFD0] bg-white shadow-inner flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#6B2D3C]/10 to-[#C5A46E]/25 flex items-center justify-center">
            <Package className="w-8 h-8 text-[#6B2D3C]" strokeWidth={1.5} />
          </div>
        </div>
        <p className="text-[11px] tracking-[0.28em] text-[#C5A46E] font-medium mb-3">
          YOUR WARDROBE AWAITS
        </p>
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#2C2522] mb-3">
          No orders yet
        </h2>
        <p className="text-sm text-[#6B5F54] max-w-sm mx-auto leading-relaxed mb-2">
          When you purchase premium Kwari fabrics, every delivery step will live here —
          elegant, clear, and always up to date.
        </p>
        {accountEmail ? (
          <p className="text-xs text-[#8A7E72] mb-8">
            Looking up orders for{" "}
            <span className="font-medium text-[#2C2522]">{accountEmail}</span>
          </p>
        ) : (
          <div className="mb-8" />
        )}
        <Link
          href="/shop"
          className="btn-primary inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl text-sm font-medium min-h-[48px] shadow-lg shadow-[#6B2D3C]/20"
        >
          Start shopping
          <ShoppingBag className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
