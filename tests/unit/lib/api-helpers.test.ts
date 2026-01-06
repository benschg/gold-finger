import { describe, expect, it, vi } from "vitest";
import {
  checkAccountMembership,
  requireAccountMembership,
  requireAccountOwner,
  applyRateLimit,
} from "@/lib/api-helpers";

// Helper to create mock Supabase client
function createMockSupabase(membershipData: { role: string } | null) {
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: membershipData,
              error: null,
            }),
          }),
        }),
      }),
    }),
  } as any;
}

describe("checkAccountMembership", () => {
  it("returns isMember true and role when user is a member", async () => {
    const supabase = createMockSupabase({ role: "member" });

    const result = await checkAccountMembership(supabase, "account-1", "user-1");

    expect(result.isMember).toBe(true);
    expect(result.role).toBe("member");
  });

  it("returns isMember true and owner role for owners", async () => {
    const supabase = createMockSupabase({ role: "owner" });

    const result = await checkAccountMembership(supabase, "account-1", "user-1");

    expect(result.isMember).toBe(true);
    expect(result.role).toBe("owner");
  });

  it("returns isMember false when user is not a member", async () => {
    const supabase = createMockSupabase(null);

    const result = await checkAccountMembership(supabase, "account-1", "user-1");

    expect(result.isMember).toBe(false);
    expect(result.role).toBeNull();
  });

  it("calls supabase with correct parameters", async () => {
    const supabase = createMockSupabase({ role: "member" });

    await checkAccountMembership(supabase, "account-123", "user-456");

    expect(supabase.from).toHaveBeenCalledWith("account_members");
  });
});

describe("requireAccountMembership", () => {
  it("returns null when user is a member", async () => {
    const supabase = createMockSupabase({ role: "member" });

    const result = await requireAccountMembership(supabase, "account-1", "user-1");

    expect(result).toBeNull();
  });

  it("returns null when user is an owner", async () => {
    const supabase = createMockSupabase({ role: "owner" });

    const result = await requireAccountMembership(supabase, "account-1", "user-1");

    expect(result).toBeNull();
  });

  it("returns 403 response when user is not a member", async () => {
    const supabase = createMockSupabase(null);

    const result = await requireAccountMembership(supabase, "account-1", "user-1");

    expect(result).not.toBeNull();
    expect(result?.status).toBe(403);
    const body = await result?.json();
    expect(body.error).toBe("Forbidden");
  });
});

describe("requireAccountOwner", () => {
  it("returns null when user is an owner", async () => {
    const supabase = createMockSupabase({ role: "owner" });

    const result = await requireAccountOwner(supabase, "account-1", "user-1");

    expect(result).toBeNull();
  });

  it("returns 403 response when user is a member but not owner", async () => {
    const supabase = createMockSupabase({ role: "member" });

    const result = await requireAccountOwner(supabase, "account-1", "user-1");

    expect(result).not.toBeNull();
    expect(result?.status).toBe(403);
    const body = await result?.json();
    expect(body.error).toBe("Only owners can perform this action");
  });

  it("returns 403 response when user is not a member", async () => {
    const supabase = createMockSupabase(null);

    const result = await requireAccountOwner(supabase, "account-1", "user-1");

    expect(result).not.toBeNull();
    expect(result?.status).toBe(403);
  });

  it("uses custom error message when provided", async () => {
    const supabase = createMockSupabase({ role: "member" });

    const result = await requireAccountOwner(
      supabase,
      "account-1",
      "user-1",
      "Custom error message"
    );

    const body = await result?.json();
    expect(body.error).toBe("Custom error message");
  });
});

describe("applyRateLimit", () => {
  it("returns null when request is allowed (first request)", () => {
    const request = new Request("http://localhost/api/test");
    const config = { windowMs: 60000, maxRequests: 100 };

    const result = applyRateLimit(request, "unique-user-1", config);

    expect(result).toBeNull();
  });

  it("returns 429 response when rate limit exceeded", () => {
    const config = { windowMs: 60000, maxRequests: 1 };

    // First request should pass
    const request1 = new Request("http://localhost/api/test");
    applyRateLimit(request1, "rate-limit-user", config);

    // Second request should be blocked
    const request2 = new Request("http://localhost/api/test");
    const result = applyRateLimit(request2, "rate-limit-user", config);

    expect(result).not.toBeNull();
    expect(result?.status).toBe(429);
  });

  it("includes Retry-After header when rate limited", () => {
    const config = { windowMs: 30000, maxRequests: 1 };

    const request1 = new Request("http://localhost/api/test");
    applyRateLimit(request1, "retry-after-user", config);

    const request2 = new Request("http://localhost/api/test");
    const result = applyRateLimit(request2, "retry-after-user", config);

    expect(result?.headers.get("Retry-After")).toBeDefined();
    const retryAfter = parseInt(result?.headers.get("Retry-After") || "0");
    expect(retryAfter).toBeGreaterThan(0);
    expect(retryAfter).toBeLessThanOrEqual(30);
  });

  it("returns proper error message when rate limited", async () => {
    const config = { windowMs: 60000, maxRequests: 1 };

    const request1 = new Request("http://localhost/api/test");
    applyRateLimit(request1, "error-msg-user", config);

    const request2 = new Request("http://localhost/api/test");
    const result = applyRateLimit(request2, "error-msg-user", config);

    const body = await result?.json();
    expect(body.error).toBe("Too many requests. Please try again later.");
  });
});
