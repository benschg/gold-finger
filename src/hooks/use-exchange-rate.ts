"use client";

import { useState, useEffect, useCallback } from "react";
import { useDebouncedValue } from "./use-debounced-value";

interface UseExchangeRateOptions {
  fromCurrency: string;
  toCurrency: string;
  amount?: number;
  enabled?: boolean;
  debounceMs?: number;
}

interface UseExchangeRateResult {
  rate: number | null;
  convertedAmount: number | null;
  rateDate: string | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useExchangeRate({
  fromCurrency,
  toCurrency,
  amount = 0,
  enabled = true,
  debounceMs = 300,
}: UseExchangeRateOptions): UseExchangeRateResult {
  const [rate, setRate] = useState<number | null>(null);
  const [rateDate, setRateDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce only the amount to avoid API spam during typing
  const debouncedAmount = useDebouncedValue(amount, debounceMs);

  const fetchRate = useCallback(async () => {
    // Don't fetch if disabled or same currency
    if (!enabled || fromCurrency === toCurrency) {
      setRate(fromCurrency === toCurrency ? 1 : null);
      setRateDate(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/exchange-rates?from=${fromCurrency}&to=${toCurrency}`
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch exchange rate");
      }

      const data = await response.json();
      setRate(data.rate);
      setRateDate(data.date);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch rate");
      setRate(null);
      setRateDate(null);
    } finally {
      setIsLoading(false);
    }
  }, [fromCurrency, toCurrency, enabled]);

  // Fetch rate when currencies change
  useEffect(() => {
    fetchRate();
  }, [fetchRate]);

  // Calculate converted amount locally when rate exists
  const convertedAmount =
    rate !== null && debouncedAmount > 0
      ? Math.round(debouncedAmount * rate * 100) / 100
      : null;

  return {
    rate,
    convertedAmount,
    rateDate,
    isLoading,
    error,
    refetch: fetchRate,
  };
}
