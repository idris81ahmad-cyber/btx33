"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ORDER_STATUSES,
  isValidOrderStatus,
  orderStatusClass,
  orderStatusLabel,
} from "@/lib/order-status";
import type { ShippingJson } from "@/lib/db/schema";

export interface AdminOrder {
  orderNumber: string;
  fullName: string;
  email: string;
  phone: string;
  total: number;
  status: string;
  createdAt: string;
  shipping?: ShippingJson;
  trackingNumber?: string | null;
  adminNotes?: string | null;
  couponCode?: string | null;
  items: {
    name: string;
    quantity: number;
    selectedLength?: string;
    lineTotal?: number;
    category?: string;
  }[];
}

const PAGE_SIZE = 10;

function formatShipping(shipping?: ShippingJson) {
  if (!shipping) return "—";
  const line = [shipping.address, shipping.city, shipping.state].filter(Boolean).join(", ");
  return line || "—";
}

function matchesSearch(order: AdminOrder, q: string) {
  if (!q) return true;
  const hay = [
    order.orderNumber,
    order.fullName,
    order.email,
    order.phone,
    order.shipping?.city,
    order.shipping?.state,
    order.shipping?.address,
    ...(order.items?.map((i) => i.name) ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
}

export default function OrderManager() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [updatingIds, setUpdatingIds] = useState<string[]>([]);

  // Confirm modal
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [bulkStatus, setBulkStatus] = useState<string>("processing");

  // Expanded row
  const [expanded, setExpanded] = useState<string | null>(null);

  // Ship modal
  const [shipOrder, setShipOrder] = useState<AdminOrder | null>(null);
  const [shipTracking, setShipTracking] = useState("");
  const [shipNotes, setShipNotes] = useState("");
  const [shippingBusy, setShippingBusy] = useState(false);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/orders", { credentials: "include" });
      const data = await res.json();
      const list: AdminOrder[] = Array.isArray(data) ? data : data.orders ?? [];
      setOrders(
        list.map((o) => ({
          ...o,
          createdAt:
            typeof o.createdAt === "string"
              ? o.createdAt
              : new Date(o.createdAt as unknown as string).toISOString(),
        })),
      );
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
    setSelected([]);
  }, [search, statusFilter]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: orders.length };
    for (const s of ORDER_STATUSES) counts[s] = 0;
    for (const o of orders) {
      counts[o.status] = (counts[o.status] || 0) + 1;
    }
    return counts;
  }, [orders]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      return matchesSearch(o, q);
    });
  }, [orders, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageSlice = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const pageOrderNumbers = pageSlice.map((o) => o.orderNumber);
  const allPageSelected =
    pageOrderNumbers.length > 0 && pageOrderNumbers.every((n) => selected.includes(n));

  const toggleSelect = (orderNumber: string) => {
    setSelected((prev) =>
      prev.includes(orderNumber)
        ? prev.filter((n) => n !== orderNumber)
        : [...prev, orderNumber],
    );
  };

  const toggleSelectAllPage = () => {
    if (allPageSelected) {
      setSelected((prev) => prev.filter((n) => !pageOrderNumbers.includes(n)));
    } else {
      setSelected((prev) => Array.from(new Set([...prev, ...pageOrderNumbers])));
    }
  };

  const askConfirm = (title: string, message: string, action: () => void) => {
    setConfirmTitle(title);
    setConfirmMessage(message);
    setConfirmAction(() => action);
    setConfirmOpen(true);
  };

  const closeConfirm = () => {
    setConfirmOpen(false);
    setConfirmAction(null);
  };

  const runConfirm = () => {
    confirmAction?.();
    closeConfirm();
  };

  const applyStatusUpdate = async (
    orderNumbers: string[],
    status: string,
    extra?: { trackingNumber?: string; adminNotes?: string; sendShippingEmail?: boolean },
  ) => {
    if (!isValidOrderStatus(status) || orderNumbers.length === 0) return;

    setUpdatingIds((prev) => Array.from(new Set([...prev, ...orderNumbers])));
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(
          orderNumbers.length === 1
            ? {
                orderNumber: orderNumbers[0],
                status,
                trackingNumber: extra?.trackingNumber,
                adminNotes: extra?.adminNotes,
                sendShippingEmail: extra?.sendShippingEmail,
              }
            : { orderNumbers, status },
        ),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Failed to update order status");
        await loadOrders();
        return;
      }

      setOrders((prev) =>
        prev.map((o) =>
          orderNumbers.includes(o.orderNumber)
            ? {
                ...o,
                status,
                ...(extra?.trackingNumber !== undefined
                  ? { trackingNumber: extra.trackingNumber }
                  : {}),
                ...(extra?.adminNotes !== undefined
                  ? { adminNotes: extra.adminNotes }
                  : {}),
              }
            : o,
        ),
      );
      setSelected((prev) => prev.filter((n) => !orderNumbers.includes(n)));
      toast.success(
        orderNumbers.length === 1
          ? `Order ${orderNumbers[0]} → ${orderStatusLabel(status)}${
              data.emailSent ? " · customer emailed" : ""
            }`
          : `${orderNumbers.length} orders → ${orderStatusLabel(status)}`,
      );
    } catch {
      toast.error("Network error updating orders");
      await loadOrders();
    } finally {
      setUpdatingIds((prev) => prev.filter((n) => !orderNumbers.includes(n)));
    }
  };

  const onStatusSelect = (order: AdminOrder, nextStatus: string) => {
    if (nextStatus === order.status) return;
    if (nextStatus === "shipped") {
      setShipOrder(order);
      setShipTracking(order.trackingNumber || "");
      setShipNotes(order.adminNotes || "");
      return;
    }
    askConfirm(
      "Update order status",
      `Change ${order.orderNumber} from "${orderStatusLabel(order.status)}" to "${orderStatusLabel(nextStatus)}"?`,
      () => {
        void applyStatusUpdate([order.orderNumber], nextStatus);
      },
    );
  };

  const confirmShip = async () => {
    if (!shipOrder) return;
    setShippingBusy(true);
    await applyStatusUpdate([shipOrder.orderNumber], "shipped", {
      trackingNumber: shipTracking,
      adminNotes: shipNotes,
      sendShippingEmail: true,
    });
    setShippingBusy(false);
    setShipOrder(null);
  };

  const saveAdminNotes = async (order: AdminOrder, notes: string) => {
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber: order.orderNumber,
          adminNotes: notes,
        }),
      });
      if (!res.ok) {
        toast.error("Could not save notes");
        return;
      }
      setOrders((prev) =>
        prev.map((o) =>
          o.orderNumber === order.orderNumber ? { ...o, adminNotes: notes } : o,
        ),
      );
      toast.success("Internal note saved");
    } catch {
      toast.error("Network error");
    }
  };

  const onBulkStatus = () => {
    if (selected.length === 0) {
      toast.error("Select at least one order");
      return;
    }
    if (!isValidOrderStatus(bulkStatus)) return;
    askConfirm(
      "Bulk status update",
      `Set ${selected.length} selected order(s) to "${orderStatusLabel(bulkStatus)}"?`,
      () => {
        void applyStatusUpdate(selected, bulkStatus);
      },
    );
  };

  const exportCsv = () => {
    const rows = filtered;
    if (rows.length === 0) {
      toast.error("No orders to export");
      return;
    }

    const escape = (value: unknown) => {
      const s = String(value ?? "");
      if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };

    const headers = [
      "orderNumber",
      "status",
      "fullName",
      "email",
      "phone",
      "total",
      "city",
      "state",
      "address",
      "items",
      "createdAt",
    ];

    const lines = [
      headers.join(","),
      ...rows.map((o) =>
        [
          o.orderNumber,
          o.status,
          o.fullName,
          o.email,
          o.phone,
          o.total,
          o.shipping?.city ?? "",
          o.shipping?.state ?? "",
          o.shipping?.address ?? "",
          (o.items || [])
            .map((i) => `${i.name} x${i.quantity}${i.selectedLength ? ` (${i.selectedLength})` : ""}`)
            .join("; "),
          o.createdAt,
        ]
          .map(escape)
          .join(","),
      ),
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `biyora-orders-${stamp}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} order(s)`);
  };

  return (
    <div className="space-y-4">
      {/* Status summary chips */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setStatusFilter("all")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
            statusFilter === "all"
              ? "bg-[#6B2D3C] text-white border-[#6B2D3C]"
              : "bg-white border-[#D4C9B8] text-[#6B5F54] hover:bg-[#F8F4EC]"
          }`}
        >
          All ({statusCounts.all || 0})
        </button>
        {ORDER_STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition capitalize ${
              statusFilter === s
                ? "bg-[#6B2D3C] text-white border-[#6B2D3C]"
                : `${orderStatusClass(s)} hover:opacity-90`
            }`}
          >
            {orderStatusLabel(s)} ({statusCounts[s] || 0})
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-[#D4C9B8] rounded-3xl overflow-hidden">
        <div className="px-4 md:px-6 py-4 border-b flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
          <div>
            <h2 className="font-semibold text-xl tracking-tight">Orders</h2>
            <p className="text-xs text-[#6B5F54] mt-0.5">
              {filtered.length} match{filtered.length === 1 ? "" : "es"}
              {statusFilter !== "all" || search.trim()
                ? ` · filtered from ${orders.length}`
                : ""}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search order #, name, email, city…"
              aria-label="Search orders"
              className="input-premium rounded-xl px-3 py-2.5 text-sm w-full sm:w-72 min-h-[44px]"
            />
            <button
              type="button"
              onClick={exportCsv}
              disabled={filtered.length === 0}
              className="px-4 py-2.5 text-sm border border-[#D4C9B8] rounded-xl hover:bg-[#F8F4EC] min-h-[44px] disabled:opacity-50"
            >
              Export CSV
            </button>
            <button
              type="button"
              onClick={() => void loadOrders()}
              className="px-4 py-2.5 text-sm border border-[#D4C9B8] rounded-xl hover:bg-[#F8F4EC] min-h-[44px]"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Bulk bar */}
        {selected.length > 0 && (
          <div className="px-4 md:px-6 py-3 bg-[#F8F4EC] border-b flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="text-sm font-medium">
              {selected.length} selected
              <button
                type="button"
                onClick={() => setSelected([])}
                className="ml-3 text-xs text-[#6B5F54] underline"
              >
                Clear
              </button>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <select
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value)}
                className="input-premium text-xs rounded-xl px-2 py-1.5"
              >
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {orderStatusLabel(s)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={onBulkStatus}
                disabled={updatingIds.length > 0}
                className="btn-primary text-xs px-4 py-2 rounded-xl disabled:opacity-60"
              >
                Apply status
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="p-6 space-y-3" aria-busy="true" aria-label="Loading orders">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 skeleton rounded-2xl" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-[#6B5F54]">
            No orders yet. Place a test order on the live site to see it here.
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-[#6B5F54]">
            No orders match your search or filters.
            <button
              type="button"
              className="block mx-auto mt-3 text-sm underline min-h-[44px]"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
              }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <ul className="md:hidden divide-y divide-[#EDE6D9]" aria-label="Orders list">
              {pageSlice.map((o) => {
                const isUpdating = updatingIds.includes(o.orderNumber);
                const isOpen = expanded === o.orderNumber;
                return (
                  <li key={o.orderNumber} className="p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selected.includes(o.orderNumber)}
                        onChange={() => toggleSelect(o.orderNumber)}
                        className="accent-[#6B2D3C] mt-1 w-4 h-4"
                        aria-label={`Select ${o.orderNumber}`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-[11px] font-medium break-all">
                          {o.orderNumber}
                        </p>
                        <p className="font-medium text-sm mt-1">{o.fullName}</p>
                        <p className="text-xs text-[#6B5F54] truncate">{o.email}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium border capitalize ${orderStatusClass(o.status)}`}
                          >
                            {orderStatusLabel(o.status)}
                          </span>
                          <span className="text-sm font-semibold tabular-nums">
                            ₦{(o.total ?? 0).toLocaleString()}
                          </span>
                          <span className="text-[10px] text-[#6B5F54]">
                            {new Date(o.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-[#6B5F54] mt-2 line-clamp-2">
                          {formatShipping(o.shipping)}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 pl-7">
                      <label className="text-[10px] text-[#6B5F54] uppercase tracking-wide">
                        Update status
                        <select
                          value={o.status}
                          disabled={isUpdating}
                          onChange={(e) => {
                            const next = e.target.value;
                            e.target.value = o.status;
                            onStatusSelect(o, next);
                          }}
                          className="input-premium text-sm rounded-xl px-3 py-2.5 w-full mt-1 min-h-[44px] disabled:opacity-60"
                          aria-label={`Status for ${o.orderNumber}`}
                        >
                          {ORDER_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {orderStatusLabel(s)}
                            </option>
                          ))}
                        </select>
                      </label>
                      <button
                        type="button"
                        onClick={() => setExpanded(isOpen ? null : o.orderNumber)}
                        className="text-xs text-[#6B2D3C] underline text-left min-h-[40px]"
                      >
                        {isOpen ? "Hide items" : "View items"}
                      </button>
                      {isOpen && (
                        <ul className="text-xs text-[#6B5F54] space-y-1 bg-[#FBF8F3] rounded-xl p-3">
                          {o.items?.length ? (
                            o.items.map((item, idx) => (
                              <li key={`${o.orderNumber}-m-${idx}`}>
                                {item.name}
                                {item.selectedLength ? ` · ${item.selectedLength}` : ""} ×{" "}
                                {item.quantity}
                              </li>
                            ))
                          ) : (
                            <li>No item details stored.</li>
                          )}
                        </ul>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm min-w-[900px]">
                <thead className="bg-[#F8F4EC] text-[#6B5F54]">
                  <tr>
                    <th className="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={allPageSelected}
                        onChange={toggleSelectAllPage}
                        className="accent-[#6B2D3C]"
                        aria-label="Select all on page"
                      />
                    </th>
                    <th className="text-left px-4 py-3">Order</th>
                    <th className="text-left px-4 py-3">Customer</th>
                    <th className="text-left px-4 py-3">Ship to</th>
                    <th className="text-right px-4 py-3">Total</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-left px-4 py-3">Date</th>
                    <th className="text-center px-4 py-3">Update</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDE6D9]">
                  {pageSlice.map((o) => {
                    const isUpdating = updatingIds.includes(o.orderNumber);
                    const isOpen = expanded === o.orderNumber;
                    return (
                      <Fragment key={o.orderNumber}>
                        <tr className="hover:bg-[#F8F4EC]/60">
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selected.includes(o.orderNumber)}
                              onChange={() => toggleSelect(o.orderNumber)}
                              className="accent-[#6B2D3C]"
                              aria-label={`Select ${o.orderNumber}`}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() =>
                                setExpanded(isOpen ? null : o.orderNumber)
                              }
                              className="font-mono text-xs font-medium text-left hover:text-[#6B2D3C] max-w-[160px] truncate block"
                              title={o.orderNumber}
                            >
                              {o.orderNumber}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setExpanded(isOpen ? null : o.orderNumber)
                              }
                              className="text-[10px] text-[#6B5F54] underline mt-0.5"
                            >
                              {isOpen ? "Hide items" : "View items"}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium">{o.fullName}</div>
                            <div className="text-xs text-[#6B5F54]">{o.email}</div>
                            {o.phone && (
                              <div className="text-xs text-[#6B5F54]">{o.phone}</div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs text-[#6B5F54] max-w-[200px]">
                            <div
                              className="line-clamp-2"
                              title={formatShipping(o.shipping)}
                            >
                              {formatShipping(o.shipping)}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-mono whitespace-nowrap">
                            ₦{(o.total ?? 0).toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border capitalize ${orderStatusClass(o.status)}`}
                            >
                              {orderStatusLabel(o.status)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[#6B5F54] whitespace-nowrap text-xs">
                            {new Date(o.createdAt).toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={o.status}
                              disabled={isUpdating}
                              onChange={(e) => {
                                const next = e.target.value;
                                // Revert visual until confirmed — controlled by o.status until update
                                e.target.value = o.status;
                                onStatusSelect(o, next);
                              }}
                              className="input-premium text-xs rounded-xl px-2 py-1 disabled:opacity-60 w-full max-w-[130px]"
                            >
                              {ORDER_STATUSES.map((s) => (
                                <option key={s} value={s}>
                                  {orderStatusLabel(s)}
                                </option>
                              ))}
                            </select>
                            {isUpdating && (
                              <div className="text-[10px] text-[#6B5F54] mt-1">
                                Saving…
                              </div>
                            )}
                          </td>
                        </tr>
                        {isOpen && (
                          <tr className="bg-[#FBF8F3]">
                            <td colSpan={8} className="px-6 py-4 space-y-4">
                              <div>
                                <div className="text-xs font-medium text-[#6B5F54] mb-2">
                                  Line items
                                </div>
                                {o.items?.length ? (
                                  <ul className="space-y-1 text-sm">
                                    {o.items.map((item, idx) => (
                                      <li
                                        key={`${o.orderNumber}-item-${idx}`}
                                        className="flex justify-between gap-4 max-w-lg"
                                      >
                                        <span>
                                          {item.name}
                                          {item.selectedLength
                                            ? ` · ${item.selectedLength}`
                                            : ""}{" "}
                                          × {item.quantity}
                                        </span>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-sm text-[#6B5F54]">No item details stored.</p>
                                )}
                              </div>
                              {o.trackingNumber && (
                                <p className="text-xs text-[#6B5F54]">
                                  Tracking:{" "}
                                  <span className="font-mono text-[#2C2522]">
                                    {o.trackingNumber}
                                  </span>
                                </p>
                              )}
                              <div className="max-w-lg">
                                <label className="text-xs font-medium text-[#6B5F54] block mb-1">
                                  Internal notes (ops only)
                                </label>
                                <textarea
                                  defaultValue={o.adminNotes || ""}
                                  rows={2}
                                  className="input-premium w-full text-sm rounded-xl"
                                  placeholder="Courier, VIP note, issue log…"
                                  onBlur={(e) => {
                                    const v = e.target.value;
                                    if (v !== (o.adminNotes || "")) {
                                      void saveAdminNotes(o, v);
                                    }
                                  }}
                                />
                              </div>
                              {o.status !== "shipped" && o.status !== "delivered" && o.status !== "cancelled" && (
                                <button
                                  type="button"
                                  className="btn-primary text-xs px-4 py-2 rounded-xl"
                                  onClick={() => {
                                    setShipOrder(o);
                                    setShipTracking(o.trackingNumber || "");
                                    setShipNotes(o.adminNotes || "");
                                  }}
                                >
                                  Mark as shipped + email customer
                                </button>
                              )}
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-4 md:px-6 py-4 border-t flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between text-sm">
              <div className="text-[#6B5F54] text-xs">
                Showing {(safePage - 1) * PAGE_SIZE + 1}–
                {Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 border border-[#D4C9B8] rounded-xl disabled:opacity-40 hover:bg-[#F8F4EC]"
                >
                  Previous
                </button>
                <span className="text-xs text-[#6B5F54] px-2">
                  Page {safePage} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 border border-[#D4C9B8] rounded-xl disabled:opacity-40 hover:bg-[#F8F4EC]"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Ship modal */}
      {shipOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h3 className="text-xl font-semibold mb-1">Mark as shipped</h3>
            <p className="text-sm text-[#6B5F54] mb-4">
              {shipOrder.orderNumber} · {shipOrder.fullName}
            </p>
            <label className="text-xs text-[#6B5F54] block mb-1">Tracking number</label>
            <input
              value={shipTracking}
              onChange={(e) => setShipTracking(e.target.value)}
              className="input-premium w-full mb-3 rounded-xl text-sm"
              placeholder="Waybill / courier ref"
            />
            <label className="text-xs text-[#6B5F54] block mb-1">Internal notes</label>
            <textarea
              value={shipNotes}
              onChange={(e) => setShipNotes(e.target.value)}
              rows={2}
              className="input-premium w-full mb-4 rounded-xl text-sm"
              placeholder="Optional ops note"
            />
            <p className="text-xs text-[#6B5F54] mb-4">
              Customer receives a shipping email with tracking (when Resend is configured).
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                className="flex-1 border border-[#D4C9B8] rounded-xl py-2.5 text-sm"
                onClick={() => setShipOrder(null)}
                disabled={shippingBusy}
              >
                Cancel
              </button>
              <button
                type="button"
                className="flex-1 btn-primary rounded-xl py-2.5 text-sm disabled:opacity-60"
                onClick={() => void confirmShip()}
                disabled={shippingBusy}
              >
                {shippingBusy ? "Sending…" : "Ship & email"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h3 className="text-xl font-semibold mb-2">{confirmTitle}</h3>
            <p className="text-[#6B5F54] mb-6 text-sm leading-relaxed">{confirmMessage}</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={closeConfirm}
                className="flex-1 py-3 border border-[#D4C9B8] rounded-xl hover:bg-[#F8F4EC]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={runConfirm}
                className="flex-1 py-3 btn-primary rounded-xl"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
