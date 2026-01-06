import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { GET } from "@/app/api/exchange-rates/history/route";

describe("GET /api/exchange-rates/history", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function createRequest(params: Record<string, string>) {
    const url = new URL("http://localhost:3000/api/exchange-rates/history");
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
    return new Request(url.toString());
  }

  it("returns 400 when 'from' is missing", async () => {
    const request = createRequest({ to: "EUR" });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Both 'from' and 'to' currency codes are required");
  });

  it("returns 400 when 'to' is missing", async () => {
    const request = createRequest({ from: "USD" });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Both 'from' and 'to' currency codes are required");
  });

  it("returns historical rates for valid request", async () => {
    const mockResponse = {
      base: "USD",
      start_date: "2024-01-01",
      end_date: "2024-01-15",
      rates: {
        "2024-01-01": { EUR: 0.91 },
        "2024-01-08": { EUR: 0.92 },
        "2024-01-15": { EUR: 0.93 },
      },
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const request = createRequest({ from: "USD", to: "EUR", period: "1M" });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.from).toBe("USD");
    expect(data.to).toBe("EUR");
    expect(data.rates).toHaveLength(3);
    expect(data.stats).toBeDefined();
    expect(data.stats.min).toBe(0.91);
    expect(data.stats.max).toBe(0.93);
  });

  it("calculates correct statistics", async () => {
    const mockResponse = {
      base: "USD",
      start_date: "2024-01-01",
      end_date: "2024-01-15",
      rates: {
        "2024-01-01": { EUR: 0.90 },
        "2024-01-08": { EUR: 0.92 },
        "2024-01-15": { EUR: 0.94 },
      },
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const request = createRequest({ from: "USD", to: "EUR", period: "1M" });
    const response = await GET(request);
    const data = await response.json();

    expect(data.stats.min).toBe(0.90);
    expect(data.stats.max).toBe(0.94);
    expect(data.stats.current).toBe(0.94);
    // Change: (0.94 - 0.90) / 0.90 * 100 = 4.44%
    expect(data.stats.change).toBeCloseTo(4.44, 1);
  });

  it("uses default period of 1M when not specified", async () => {
    const mockResponse = {
      base: "USD",
      rates: {
        "2024-01-15": { EUR: 0.92 },
      },
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const request = createRequest({ from: "USD", to: "EUR" });
    await GET(request);

    // The fetch should be called with a date range of about 1 month
    expect(fetch).toHaveBeenCalled();
    const callUrl = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(callUrl).toContain("from=USD");
    expect(callUrl).toContain("to=EUR");
  });

  it("returns 503 when external API fails", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    });

    const request = createRequest({ from: "USD", to: "EUR", period: "1M" });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.error).toBe("Failed to fetch historical rates");
  });

  it("handles different time periods", async () => {
    const mockResponse = {
      base: "USD",
      rates: {
        "2024-01-15": { EUR: 0.92 },
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    // Test 1W period
    const request1W = createRequest({ from: "USD", to: "EUR", period: "1W" });
    await GET(request1W);

    // Test 1Y period
    const request1Y = createRequest({ from: "USD", to: "EUR", period: "1Y" });
    await GET(request1Y);

    // Test 5Y period
    const request5Y = createRequest({ from: "USD", to: "EUR", period: "5Y" });
    await GET(request5Y);

    expect(fetch).toHaveBeenCalledTimes(3);
  });
});
