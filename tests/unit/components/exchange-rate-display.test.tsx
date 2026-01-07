import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { ExchangeRateDisplay } from "@/components/expenses/exchange-rate-display";

// Mock the ExchangeRateHistory component to avoid complex dialog testing
vi.mock("@/components/expenses/exchange-rate-history", () => ({
  ExchangeRateHistory: ({ trigger }: { trigger: React.ReactNode }) => trigger,
}));

describe("ExchangeRateDisplay", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders nothing when currencies are the same", () => {
    const { container } = render(
      <ExchangeRateDisplay fromCurrency="EUR" toCurrency="EUR" amount={100} />,
    );

    expect(container.firstChild).toBeNull();
  });

  it("shows loading state while fetching", async () => {
    // Mock a slow response
    global.fetch = vi.fn().mockImplementation(
      () => new Promise(() => {}), // Never resolves
    );

    render(
      <ExchangeRateDisplay fromCurrency="USD" toCurrency="EUR" amount={100} />,
    );

    expect(screen.getByText("Fetching exchange rate...")).toBeInTheDocument();
  });

  it("displays conversion when rate is fetched", async () => {
    const mockResponse = {
      rate: 0.92,
      date: "2024-01-15",
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    render(
      <ExchangeRateDisplay fromCurrency="USD" toCurrency="EUR" amount={100} />,
    );

    await waitFor(() => {
      expect(screen.getByText(/Rate: 1 USD = 0.9200 EUR/)).toBeInTheDocument();
    });

    // Check that the conversion is displayed
    expect(screen.getByText(/\$100.00/)).toBeInTheDocument();
  });

  it("uses 1 as default amount when amount is 0", async () => {
    const mockResponse = {
      rate: 0.92,
      date: "2024-01-15",
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    render(
      <ExchangeRateDisplay fromCurrency="USD" toCurrency="EUR" amount={0} />,
    );

    await waitFor(() => {
      expect(screen.getByText(/\$1.00/)).toBeInTheDocument();
    });
  });

  it("shows error message when fetch fails", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: "Service unavailable" }),
    });

    render(
      <ExchangeRateDisplay fromCurrency="USD" toCurrency="EUR" amount={100} />,
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Could not fetch exchange rate/),
      ).toBeInTheDocument();
    });
  });

  it("displays History button", async () => {
    const mockResponse = {
      rate: 0.92,
      date: "2024-01-15",
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    render(
      <ExchangeRateDisplay fromCurrency="USD" toCurrency="EUR" amount={100} />,
    );

    await waitFor(() => {
      expect(screen.getByText("History")).toBeInTheDocument();
    });
  });

  it("displays ECB source link", async () => {
    const mockResponse = {
      rate: 0.92,
      date: "2024-01-15",
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    render(
      <ExchangeRateDisplay fromCurrency="USD" toCurrency="EUR" amount={100} />,
    );

    await waitFor(() => {
      const ecbLink = screen.getByRole("link", { name: "ECB" });
      expect(ecbLink).toBeInTheDocument();
      expect(ecbLink).toHaveAttribute("href", "https://frankfurter.dev");
    });
  });

  it("uses correct currency symbols", async () => {
    const mockResponse = {
      rate: 0.79,
      date: "2024-01-15",
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    render(
      <ExchangeRateDisplay fromCurrency="EUR" toCurrency="GBP" amount={100} />,
    );

    await waitFor(() => {
      // EUR symbol
      expect(screen.getByText(/€100.00/)).toBeInTheDocument();
    });
  });
});
