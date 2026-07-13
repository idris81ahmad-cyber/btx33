import { orderStatusEnum } from "@/lib/db/schema";

export type OrderStatus = (typeof orderStatusEnum.enumValues)[number];

export const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

/** Customer-facing delivery pipeline (excludes cancelled). */
export const DELIVERY_PIPELINE: OrderStatus[] = [
  "confirmed",
  "processing",
  "shipped",
  "delivered",
];

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending: "bg-amber-50 text-amber-800 border-amber-200",
  confirmed: "bg-emerald-50 text-emerald-800 border-emerald-200",
  processing: "bg-blue-50 text-blue-800 border-blue-200",
  shipped: "bg-indigo-50 text-indigo-800 border-indigo-200",
  delivered: "bg-emerald-50 text-emerald-900 border-emerald-300",
  cancelled: "bg-red-50 text-red-700 border-red-200",
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Awaiting payment",
  confirmed: "Order confirmed",
  processing: "Preparing order",
  shipped: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const STATUS_HELP: Record<OrderStatus, string> = {
  pending: "Payment is not confirmed yet. If you already paid, wait a few minutes or contact support with your reference.",
  confirmed: "We received your payment and are reviewing your order.",
  processing: "Your fabrics are being packed and prepared for dispatch.",
  shipped: "Your order is on the way to the delivery address.",
  delivered: "Your order has been delivered. Enjoy your fabrics!",
  cancelled: "This order was cancelled. Contact support if you need help.",
};

export function isValidOrderStatus(value: string): value is OrderStatus {
  return ORDER_STATUSES.includes(value as OrderStatus);
}

export function orderStatusLabel(status: string): string {
  if (isValidOrderStatus(status)) return STATUS_LABELS[status];
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function orderStatusHelp(status: string): string {
  if (isValidOrderStatus(status)) return STATUS_HELP[status];
  return "We will update this order as it progresses.";
}

export function orderStatusClass(status: string): string {
  if (isValidOrderStatus(status)) {
    return STATUS_STYLES[status];
  }
  return "bg-[#F8F4EC] text-[#6B5F54] border-[#D4C9B8]";
}

/**
 * Progress index for delivery timeline.
 * pending → 0 (not started), confirmed → 1, … delivered → 4
 * cancelled → -1
 */
export function deliveryStepIndex(status: string): number {
  if (status === "cancelled") return -1;
  if (status === "pending") return 0;
  const idx = DELIVERY_PIPELINE.indexOf(status as OrderStatus);
  return idx >= 0 ? idx + 1 : 0;
}