/**
 * Exchange rate utilities using the Frankfurter API
 * https://frankfurter.dev/ - Free, open-source, ECB rates
 */

const FRANKFURTER_API = "https://api.frankfurter.app";
const FETCH_TIMEOUT_MS = 10000; // 10 seconds

// In-memory cache for exchange rates
const rateCache = new Map<
  string,
  { rate: number; date: string; fetchedAt: number }
>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export interface ExchangeRateResult {
  rate: number;
  date: string;
  fromCurrency: string;
  toCurrency: string;
}

/**
 * Fetch exchange rate from Frankfurter API
 * Returns the rate to convert FROM -> TO (1 FROM = X TO)
 */
export async function getExchangeRate(
  fromCurrency: string,
  toCurrency: string
): Promise<ExchangeRateResult | null> {
  // Same currency - no conversion needed
  if (fromCurrency === toCurrency) {
    return {
      rate: 1,
      date: new Date().toISOString().split("T")[0],
      fromCurrency,
      toCurrency,
    };
  }

  const cacheKey = `${fromCurrency}-${toCurrency}`;
  const cached = rateCache.get(cacheKey);

  // Return cached rate if still valid
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return {
      rate: cached.rate,
      date: cached.date,
      fromCurrency,
      toCurrency,
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const response = await fetch(
      `${FRANKFURTER_API}/latest?from=${fromCurrency}&to=${toCurrency}`,
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(
        `Frankfurter API error: ${response.status} ${response.statusText}`
      );
      // Return cached value if available, even if expired
      if (cached) {
        return {
          rate: cached.rate,
          date: cached.date,
          fromCurrency,
          toCurrency,
        };
      }
      return null;
    }

    const data = (await response.json()) as {
      base: string;
      date: string;
      rates: Record<string, number>;
    };

    const rate = data.rates[toCurrency];
    if (rate === undefined) {
      console.error(`Rate not found for ${toCurrency}`);
      return null;
    }

    // Cache the result
    rateCache.set(cacheKey, {
      rate,
      date: data.date,
      fetchedAt: Date.now(),
    });

    return {
      rate,
      date: data.date,
      fromCurrency,
      toCurrency,
    };
  } catch (error) {
    console.error("Error fetching exchange rate:", error);
    // Return cached value if available, even if expired
    if (cached) {
      return {
        rate: cached.rate,
        date: cached.date,
        fromCurrency,
        toCurrency,
      };
    }
    return null;
  }
}

/**
 * Convert an amount using a given exchange rate
 */
export function convertAmount(amount: number, rate: number): number {
  return Math.round(amount * rate * 100) / 100;
}

/**
 * Clear the rate cache (useful for testing)
 */
export function clearRateCache(): void {
  rateCache.clear();
}
