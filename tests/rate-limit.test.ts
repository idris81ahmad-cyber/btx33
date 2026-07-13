import { describe, expect, it } from "vitest";
import { rateLimit } from "@/lib/rate-limit";

describe("rateLimit", () => {
  it("allows up to the limit then blocks", () => {
    const key = `test-${Date.now()}-${Math.random()}`;
    const a = rateLimit(key, { limit: 2, windowMs: 60_000 });
    const b = rateLimit(key, { limit: 2, windowMs: 60_000 });
    const c = rateLimit(key, { limit: 2, windowMs: 60_000 });
    expect(a.ok).toBe(true);
    expect(b.ok).toBe(true);
    expect(c.ok).toBe(false);
    expect(c.remaining).toBe(0);
  });
});
