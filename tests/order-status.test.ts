import { describe, expect, it } from "vitest";
import {
  deliveryStepIndex,
  isValidOrderStatus,
  orderStatusLabel,
} from "@/lib/order-status";

describe("order status helpers", () => {
  it("validates known statuses", () => {
    expect(isValidOrderStatus("shipped")).toBe(true);
    expect(isValidOrderStatus("nope")).toBe(false);
  });

  it("maps delivery pipeline steps", () => {
    expect(deliveryStepIndex("pending")).toBe(0);
    expect(deliveryStepIndex("confirmed")).toBe(1);
    expect(deliveryStepIndex("processing")).toBe(2);
    expect(deliveryStepIndex("shipped")).toBe(3);
    expect(deliveryStepIndex("delivered")).toBe(4);
    expect(deliveryStepIndex("cancelled")).toBe(-1);
  });

  it("uses customer-friendly labels", () => {
    expect(orderStatusLabel("shipped")).toMatch(/delivery/i);
    expect(orderStatusLabel("pending")).toMatch(/payment/i);
  });
});
