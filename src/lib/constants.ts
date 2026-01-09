import type { Currency } from "@/types/database";

export interface CurrencyOption {
  code: Currency;
  label: string;
  symbol: string;
}

export const CURRENCIES: CurrencyOption[] = [
  { code: "EUR", label: "Euro", symbol: "€" },
  { code: "USD", label: "US Dollar", symbol: "$" },
  { code: "GBP", label: "British Pound", symbol: "£" },
  { code: "CHF", label: "Swiss Franc", symbol: "CHF" },
  { code: "JPY", label: "Japanese Yen", symbol: "¥" },
  { code: "CAD", label: "Canadian Dollar", symbol: "C$" },
  { code: "AUD", label: "Australian Dollar", symbol: "A$" },
];

export const DEFAULT_CURRENCY: Currency = "EUR";

// Currency symbol lookup map (for quick access)
export const CURRENCY_SYMBOLS: Record<string, string> = Object.fromEntries(
  CURRENCIES.map((c) => [c.code, c.symbol]),
);

/**
 * Get the symbol for a currency code
 */
export function getCurrencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency] || currency;
}

/**
 * Format an amount with currency symbol
 */
export function formatCurrency(
  amount: number,
  currency: string = DEFAULT_CURRENCY,
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    showPlusSign?: boolean;
  },
): string {
  const {
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    showPlusSign = false,
  } = options || {};

  const symbol = getCurrencySymbol(currency);
  const formattedAmount = amount.toLocaleString(undefined, {
    minimumFractionDigits,
    maximumFractionDigits,
  });

  const sign = showPlusSign && amount >= 0 ? "+" : "";
  return `${sign}${symbol}${formattedAmount}`;
}

// Color palettes for accounts and categories
export const ACCOUNT_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#06b6d4",
  "#3b82f6",
] as const;

export const CATEGORY_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#06b6d4",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#d946ef",
  "#ec4899",
] as const;

export const DEFAULT_ACCOUNT_COLOR = ACCOUNT_COLORS[0];
export const DEFAULT_CATEGORY_COLOR = CATEGORY_COLORS[0];

// Tag colors (same as category colors)
export const TAG_COLORS = CATEGORY_COLORS;
export const DEFAULT_TAG_COLOR = TAG_COLORS[0];

// Uncategorized defaults
export const UNCATEGORIZED_LABEL = "Uncategorized";
export const UNCATEGORIZED_COLOR = "#94a3b8";
