"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronUp,
  MapPin,
  Package,
  RefreshCw,
} from "lucide-react";
import {
  ORDER_STATUSES,
  orderStatusClass,
  orderStatusLabel,
} from "@/lib/order-status";
import OrderDeliveryTimeline from "@/components/OrderDeliveryTimeline";
import PageSkeleton from "@/components/PageSkeleton";
import type { ShippingJson } from "@/lib/db/schema";

interface OrderItem {
  name: string;
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

type StatusFilter = "all" | string;

function formatShipping(shipping?: ShippingJson) {
  if (!shipping) return null;
  const lines = [
    shipping.fullName,
    shipping.phone,
    shipping.address,
    [shipping.city, shipping.state, shipping.postalCode].filter(Boolean).join(", "),
    shipping.country || "Nigeria",
  ].filter(Boolean);
  return lines;
}

export default function OrderHistoryPage() {
  const { status } = useSession();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const loadOrders = () => {
    if (status !== "authenticated") return;
    setLoading(true);
    setError("");
    fetch("/api/account/orders", { credentials: "include" })
      .then(async (r) => {
        if (!r.ok) throw new Error("Could not load orders");
        return r.json();
      })
      .then((d) => setOrders(Array.isArray(d.orders) ? d.orders : []))
      .catch(() => setError("We could not load your orders. Please try again."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (status !== "authenticated") {
      if (status !== "loading") setLoading(false);
      return;
    }
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load when auth settles
  }, [status]);

  const filtered = useMemo(() => {
    if (filter === "all") return orders;
    return orders.filter((o) => o.status === filter);
  }, [orders, filter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: orders.length };
    for (const s of ORDER_STATUSES) c[s] = 0;
    for (const o of orders) c[o.status] = (c[o.status] || 0) + 1;
    return c;
  }, [orders]);

  if (status === "loading" || (status === "authenticated" && loading)) {
    return <PageSkeleton variant="form" />;
  }

  if (status === "unauthenticated") {
    return (
      <div className="max-w-md mx-auto px-6 py-16 text-center">
        <Package className="w-12 h-12 text-[#C5A46E] mx-auto mb-4" aria-hidden="true" />
        <h1 className="text-2xl font-semibold mb-4">Sign in to track orders</h1>
        <p className="text-[#6B5F54] mb-6">
          View order history, delivery status, and shipping details for your BIYORA purchases.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/login?callbackUrl=/account/orders"
            className="btn-primary inline-flex items-center justify-center px-8 py-3 min-h-[44px]"
          >
            Sign In
          </Link>
          <Link
            href="/signup?callbackUrl=/account/orders"
            className="inline-flex items-center justify-center px-8 py-3 border border-[#D4C9B8] rounded-2xl min-h-[44px]"
          >
            Create account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
        <div>
          <div className="text-xs tracking-[3px] text-[#C5A46E] mb-1">MY ACCOUNT</div>
          <h1 className="text-3xl font-semibold tracking-tight">My Orders</h1>
          <p className="text-sm text-[#6B5F54] mt-1">
            Track payment, packing, and delivery status
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={loadOrders}
            className="inline-flex items-center gap-1.5 text-sm px-4 py-2 border border-[#D4C9B8] rounded-xl hover:bg-white min-h-[44px]"
          >
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
            Refresh
          </button>
          <Link
            href="/account"
            className="text-sm text-[#6B2D3C] underline underline-offset-2 self-center"
          >
            Account settings
          </Link>
        </div>
      </div>

      {/* Status filters */}
      <div
        className="flex flex-wrap gap-2 mb-6"
        role="tablist"
        aria-label="Filter by order status"
      >
        <FilterChip
          active={filter === "all"}
          onClick={() => setFilter("all")}
          label={`All (${counts.all || 0})`}
        />
        {ORDER_STATUSES.filter((s) => (counts[s] || 0) > 0 || s === "shipped" || s === "delivered").map(
          (s) => (
            <FilterChip
              key={s}
              active={filter === s}
              onClick={() => setFilter(s)}
              label={`${orderStatusLabel(s)} (${counts[s] || 0})`}
            />
          ),
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-sm"
        >
          {error}
        </div>
      )}

      {orders.length === 0 && !error ? (
        <div className="bg-white rounded-2xl border border-[#D4C9B8] p-8 text-center py-12">
          <Package className="w-10 h-10 text-[#D4C9B8] mx-auto mb-3" aria-hidden="true" />
          <p className="text-[#6B5F54] mb-2 font-medium">No orders yet</p>
          <p className="text-sm text-[#6B5F54] mb-6">
            When you place an order while signed in (or with this email), it will appear here with live delivery status.
          </p>
          <Link href="/shop" className="btn-primary inline-block px-6 py-2.5 min-h-[44px]">
            Start shopping
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#D4C9B8] p-8 text-center text-[#6B5F54]">
          No orders match this filter.
          <button
            type="button"
            className="block mx-auto mt-3 text-sm underline"
            onClick={() => setFilter("all")}
          >
            Show all orders
          </button>
        </div>
      ) : (
        <ul className="space-y-4" aria-label="Order history">
          {filtered.map((o) => {
            const isOpen = expanded === o.orderNumber;
            const shipLines = formatShipping(o.shipping);

            return (
              <li
                key={o.orderNumber}
                className="bg-white rounded-2xl border border-[#D4C9B8] overflow-hidden shadow-sm"
              >
                <div className="p-5 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs text-[#6B5F54]">Order reference</p>
                      <p className="font-mono text-sm font-medium break-all">
                        {o.orderNumber}
                      </p>
                      <p className="text-xs text-[#6B5F54] mt-1">
                        Placed {new Date(o.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${orderStatusClass(o.status)}`}
                      >
                        {orderStatusLabel(o.status)}
                      </span>
                      <span className="font-semibold tabular-nums text-lg">
                        ₦{(o.total ?? 0).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-[#EDE6D9]">
                    <OrderDeliveryTimeline
                      status={o.status}
                      history={o.statusHistory}
                    />
                  </div>

                  {o.items?.length > 0 && (
                    <ul className="mt-4 space-y-1 text-sm text-[#6B5F54]">
                      {o.items.slice(0, isOpen ? undefined : 2).map((item, idx) => (
                        <li key={`${o.orderNumber}-sum-${idx}`} className="flex justify-between gap-3">
                          <span className="min-w-0 truncate">
                            {item.name}
                            {item.selectedLength ? ` · ${item.selectedLength}` : ""} ×{" "}
                            {item.quantity}
                          </span>
                          {typeof item.lineTotal === "number" && (
                            <span className="tabular-nums shrink-0">
                              ₦{item.lineTotal.toLocaleString()}
                            </span>
                          )}
                        </li>
                      ))}
                      {!isOpen && o.items.length > 2 && (
                        <li className="text-xs">+{o.items.length - 2} more item(s)</li>
                      )}
                    </ul>
                  )}

                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : o.orderNumber)}
                    className="mt-4 inline-flex items-center gap-1 text-sm text-[#6B2D3C] font-medium min-h-[44px]"
                    aria-expanded={isOpen}
                  >
                    {isOpen ? (
                      <>
                        Hide delivery details <ChevronUp className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        Delivery address & details <ChevronDown className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>

                {isOpen && (
                  <div className="px-5 sm:px-6 pb-6 pt-0 space-y-4 border-t border-[#EDE6D9] bg-[#FBF8F3]">
                    <div className="pt-4 grid sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <h3 className="text-xs tracking-wide text-[#6B5F54] uppercase mb-2 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                          Deliver to
                        </h3>
                        {shipLines ? (
                          <address className="not-italic text-[#2C2522] leading-relaxed">
                            {shipLines.map((line) => (
                              <div key={line}>{line}</div>
                            ))}
                          </address>
                        ) : (
                          <p className="text-[#6B5F54]">No shipping address on file.</p>
                        )}
                      </div>
                      <div>
                        <h3 className="text-xs tracking-wide text-[#6B5F54] uppercase mb-2">
                          Payment summary
                        </h3>
                        <dl className="space-y-1 text-[#6B5F54]">
                          {typeof o.subtotal === "number" && (
                            <div className="flex justify-between gap-4">
                              <dt>Subtotal</dt>
                              <dd className="tabular-nums">₦{o.subtotal.toLocaleString()}</dd>
                            </div>
                          )}
                          {typeof o.shippingFee === "number" && (
                            <div className="flex justify-between gap-4">
                              <dt>Shipping</dt>
                              <dd className="tabular-nums">₦{o.shippingFee.toLocaleString()}</dd>
                            </div>
                          )}
                          {typeof o.discount === "number" && o.discount > 0 && (
                            <div className="flex justify-between gap-4 text-emerald-800">
                              <dt>Discount{o.couponCode ? ` (${o.couponCode})` : ""}</dt>
                              <dd className="tabular-nums">−₦{o.discount.toLocaleString()}</dd>
                            </div>
                          )}
                          <div className="flex justify-between gap-4 font-semibold text-[#2C2522] pt-1 border-t border-[#EDE6D9]">
                            <dt>Total</dt>
                            <dd className="tabular-nums">₦{(o.total ?? 0).toLocaleString()}</dd>
                          </div>
                          {o.paymentMethod && (
                            <div className="flex justify-between gap-4 text-xs pt-1">
                              <dt>Method</dt>
                              <dd className="capitalize">{o.paymentMethod}</dd>
                            </div>
                          )}
                        </dl>
                      </div>
                    </div>

                    <p className="text-xs text-[#6B5F54]">
                      Need help with delivery?{" "}
                      <Link href="/contact" className="underline text-[#6B2D3C]">
                        Contact support
                      </Link>{" "}
                      with reference <span className="font-mono">{o.orderNumber}</span>.
                    </p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition min-h-[36px] ${
        active
          ? "bg-[#6B2D3C] text-white border-[#6B2D3C]"
          : "bg-white border-[#D4C9B8] text-[#6B5F54] hover:bg-[#F8F4EC]"
      }`}
    >
      {label}
    </button>
  );
}
