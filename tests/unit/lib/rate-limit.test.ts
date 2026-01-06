import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  checkRateLimit,
  getClientIdentifier,
  RATE_LIMITS,
} from "@/lib/rate-limit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    // Reset the rate limit store by waiting for window to expire
    vi.useFakeTimers();
  });

  it("allows first request", () => {
    const config = { windowMs: 1000, maxRequests: 5 };
    const result = checkRateLimit("test-user-1", config);

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("decrements remaining count on subsequent requests", () => {
    const config = { windowMs: 60000, maxRequests: 5 };
    const identifier = "test-user-2";

    const result1 = checkRateLimit(identifier, config);
    expect(result1.remaining).toBe(4);

    const result2 = checkRateLimit(identifier, config);
    expect(result2.remaining).toBe(3);

    const result3 = checkRateLimit(identifier, config);
    expect(result3.remaining).toBe(2);
  });

  it("blocks requests when limit exceeded", () => {
    const config = { windowMs: 60000, maxRequests: 2 };
    const identifier = "test-user-3";

    checkRateLimit(identifier, config); // 1st
    checkRateLimit(identifier, config); // 2nd
    const result = checkRateLimit(identifier, config); // 3rd - should be blocked

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("resets after window expires", () => {
    const config = { windowMs: 1000, maxRequests: 2 };
    const identifier = "test-user-4";

    checkRateLimit(identifier, config);
    checkRateLimit(identifier, config);
    const blocked = checkRateLimit(identifier, config);
    expect(blocked.allowed).toBe(false);

    // Advance time past the window
    vi.advanceTimersByTime(1500);

    const result = checkRateLimit(identifier, config);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(1);
  });

  it("tracks different identifiers separately", () => {
    const config = { windowMs: 60000, maxRequests: 1 };

    const result1 = checkRateLimit("user-a", config);
    const result2 = checkRateLimit("user-b", config);

    expect(result1.allowed).toBe(true);
    expect(result2.allowed).toBe(true);
  });
});

describe("getClientIdentifier", () => {
  it("returns user identifier when userId provided", () => {
    const request = new Request("http://localhost/api/test");
    const result = getClientIdentifier(request, "user-123");
    expect(result).toBe("user:user-123");
  });

  it("returns IP from x-forwarded-for header", () => {
    const request = new Request("http://localhost/api/test", {
      headers: { "x-forwarded-for": "192.168.1.1, 10.0.0.1" },
    });
    const result = getClientIdentifier(request);
    expect(result).toBe("ip:192.168.1.1");
  });

  it("returns IP from x-real-ip header", () => {
    const request = new Request("http://localhost/api/test", {
      headers: { "x-real-ip": "192.168.1.2" },
    });
    const result = getClientIdentifier(request);
    expect(result).toBe("ip:192.168.1.2");
  });

  it("prefers userId over IP headers", () => {
    const request = new Request("http://localhost/api/test", {
      headers: { "x-forwarded-for": "192.168.1.1" },
    });
    const result = getClientIdentifier(request, "user-456");
    expect(result).toBe("user:user-456");
  });

  it("returns unknown when no identifier available", () => {
    const request = new Request("http://localhost/api/test");
    const result = getClientIdentifier(request);
    expect(result).toBe("ip:unknown");
  });
});

describe("RATE_LIMITS presets", () => {
  it("has strict preset configured", () => {
    expect(RATE_LIMITS.strict.windowMs).toBe(60000);
    expect(RATE_LIMITS.strict.maxRequests).toBe(10);
  });

  it("has medium preset configured", () => {
    expect(RATE_LIMITS.medium.windowMs).toBe(60000);
    expect(RATE_LIMITS.medium.maxRequests).toBe(20);
  });

  it("has auth preset configured", () => {
    expect(RATE_LIMITS.auth.windowMs).toBe(60000);
    expect(RATE_LIMITS.auth.maxRequests).toBe(10);
  });
});
