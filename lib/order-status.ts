import { orderStatusEnum } from "@/lib/db/schema";

type OrderStatus = (typeof orderStatusEnum.enumValues)[number];

export const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending: "bg-amber-50 text-amber-800 border-amber-200",
  confirmed: "bg-emerald-50 text-emerald-800 border-emerald-200",
  processing: "bg-blue-50 text-blue-800 border-blue-200",
  shipped: "bg-indigo-50 text-indigo-800 border-indigo-200",
  delivered: "bg-emerald-50 text-emerald-900 border-emerald-300",
  cancelled: "bg-red-50 text-red-700 border-red-200",
};

export function isValidOrderStatus(value: string): value is OrderStatus {
  return ORDER_STATUSES.includes(value as OrderStatus);
}

export function orderStatusLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function orderStatusClass(status: string): string {
  if (isValidOrderStatus(status)) {
    return STATUS_STYLES[status];
  }
  return "bg-[#F8F4EC] text-[#6B5F54] border-[#D4C9B8]";
}