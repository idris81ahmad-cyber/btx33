import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { verifyPaystackWebhookSignature } from "@/lib/paystack";

describe("verifyPaystackWebhookSignature", () => {
  beforeEach(() => {
    process.env.PAYSTACK_SECRET_KEY = "sk_test_unit_secret";
  });

  it("returns false without signature", () => {
    expect(verifyPaystackWebhookSignature("{}", null)).toBe(false);
  });

  it("accepts valid HMAC SHA512 signature", () => {
    const body = JSON.stringify({ event: "charge.success", data: { reference: "BIYORA-1" } });
    const sig = createHmac("sha512", "sk_test_unit_secret").update(body).digest("hex");
    expect(verifyPaystackWebhookSignature(body, sig)).toBe(true);
  });

  it("rejects tampered body", () => {
    const body = JSON.stringify({ event: "charge.success" });
    const sig = createHmac("sha512", "sk_test_unit_secret").update(body).digest("hex");
    expect(verifyPaystackWebhookSignature(body + " ", sig)).toBe(false);
  });
});
