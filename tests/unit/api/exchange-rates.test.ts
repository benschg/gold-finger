import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { GET } from "@/app/api/exchange-rates/route";
import { clearRateCache } from "@/lib/exchange-rates";

describe("GET /api/exchange-rates", () => {
  beforeEach(() => {
    clearRateCache();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    clearRateCache();
  });

  function createRequest(params: Record<string, string>) {
    const url = new URL("http://localhost:3000/api/exchange-rates");
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

  it("returns 400 for invalid currency codes", async () => {
    const request = createRequest({ from: "US", to: "EUR" });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe(
      "Currency codes must be 3 uppercase letters (e.g., USD, EUR)",
    );
  });

  it("returns 400 for lowercase currency codes", async () => {
    const request = createRequest({ from: "usd", to: "eur" });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe(
      "Currency codes must be 3 uppercase letters (e.g., USD, EUR)",
    );
  });

  it("returns exchange rate for valid currencies", async () => {
    const mockResponse = {
      base: "USD",
      date: "2024-01-15",
      rates: { EUR: 0.92 },
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const request = createRequest({ from: "USD", to: "EUR" });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.from).toBe("USD");
    expect(data.to).toBe("EUR");
    expect(data.rate).toBe(0.92);
    expect(data.date).toBe("2024-01-15");
  });

  it("returns rate of 1 for same currency", async () => {
    const request = createRequest({ from: "EUR", to: "EUR" });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.rate).toBe(1);
    expect(data.from).toBe("EUR");
    expect(data.to).toBe("EUR");
  });

  it("includes converted amount when amount parameter provided", async () => {
    const mockResponse = {
      base: "USD",
      date: "2024-01-15",
      rates: { EUR: 0.92 },
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const request = createRequest({ from: "USD", to: "EUR", amount: "100" });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.convertedAmount).toBe(92);
  });

  it("ignores invalid amount parameter", async () => {
    const mockResponse = {
      base: "USD",
      date: "2024-01-15",
      rates: { EUR: 0.92 },
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const request = createRequest({
      from: "USD",
      to: "EUR",
      amount: "invalid",
    });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.convertedAmount).toBeUndefined();
  });

  it("returns 503 when external API fails", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    });

    const request = createRequest({ from: "USD", to: "EUR" });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.error).toBe("Failed to fetch exchange rate");
  });
});
