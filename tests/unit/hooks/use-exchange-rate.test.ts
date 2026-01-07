import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useExchangeRate } from "@/hooks/use-exchange-rate";

describe("useExchangeRate", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns rate of 1 for same currency without fetching", async () => {
    global.fetch = vi.fn();

    const { result } = renderHook(() =>
      useExchangeRate({
        fromCurrency: "EUR",
        toCurrency: "EUR",
        amount: 100,
        debounceMs: 0,
      }),
    );

    await waitFor(() => {
      expect(result.current.rate).toBe(1);
    });

    expect(fetch).not.toHaveBeenCalled();
    expect(result.current.error).toBeNull();
  });

  it("fetches rate for different currencies", async () => {
    const mockResponse = {
      rate: 0.92,
      date: "2024-01-15",
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const { result } = renderHook(() =>
      useExchangeRate({
        fromCurrency: "USD",
        toCurrency: "EUR",
        amount: 100,
        debounceMs: 0,
      }),
    );

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.rate).toBe(0.92);
    expect(result.current.rateDate).toBe("2024-01-15");
    expect(fetch).toHaveBeenCalledWith("/api/exchange-rates?from=USD&to=EUR");
  });

  it("calculates converted amount correctly", async () => {
    const mockResponse = {
      rate: 0.92,
      date: "2024-01-15",
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const { result } = renderHook(() =>
      useExchangeRate({
        fromCurrency: "USD",
        toCurrency: "EUR",
        amount: 100,
        debounceMs: 0, // No debounce for testing
      }),
    );

    await waitFor(() => {
      expect(result.current.rate).toBe(0.92);
    });

    expect(result.current.convertedAmount).toBe(92);
  });

  it("returns null convertedAmount when amount is 0", async () => {
    const mockResponse = {
      rate: 0.92,
      date: "2024-01-15",
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const { result } = renderHook(() =>
      useExchangeRate({
        fromCurrency: "USD",
        toCurrency: "EUR",
        amount: 0,
      }),
    );

    await waitFor(() => {
      expect(result.current.rate).toBe(0.92);
    });

    expect(result.current.convertedAmount).toBeNull();
  });

  it("does not fetch when disabled", async () => {
    global.fetch = vi.fn();

    const { result } = renderHook(() =>
      useExchangeRate({
        fromCurrency: "USD",
        toCurrency: "EUR",
        amount: 100,
        enabled: false,
      }),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(fetch).not.toHaveBeenCalled();
    expect(result.current.rate).toBeNull();
  });

  it("handles API errors", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: "Service unavailable" }),
    });

    const { result } = renderHook(() =>
      useExchangeRate({
        fromCurrency: "USD",
        toCurrency: "EUR",
        amount: 100,
      }),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe("Service unavailable");
    expect(result.current.rate).toBeNull();
  });

  it("handles network errors", async () => {
    global.fetch = vi.fn().mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() =>
      useExchangeRate({
        fromCurrency: "USD",
        toCurrency: "EUR",
        amount: 100,
      }),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe("Network error");
    expect(result.current.rate).toBeNull();
  });

  it("refetches when refetch is called", async () => {
    const mockResponse = {
      rate: 0.92,
      date: "2024-01-15",
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const { result } = renderHook(() =>
      useExchangeRate({
        fromCurrency: "USD",
        toCurrency: "EUR",
        amount: 100,
      }),
    );

    await waitFor(() => {
      expect(result.current.rate).toBe(0.92);
    });

    expect(fetch).toHaveBeenCalledTimes(1);

    // Call refetch
    await act(async () => {
      result.current.refetch();
    });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });

  it("refetches when currencies change", async () => {
    const mockResponse = {
      rate: 0.92,
      date: "2024-01-15",
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const { result, rerender } = renderHook(
      ({ from, to }) =>
        useExchangeRate({
          fromCurrency: from,
          toCurrency: to,
          amount: 100,
        }),
      { initialProps: { from: "USD", to: "EUR" } },
    );

    await waitFor(() => {
      expect(result.current.rate).toBe(0.92);
    });

    expect(fetch).toHaveBeenCalledTimes(1);

    // Change currencies
    rerender({ from: "GBP", to: "EUR" });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    expect(fetch).toHaveBeenLastCalledWith(
      "/api/exchange-rates?from=GBP&to=EUR",
    );
  });
});
