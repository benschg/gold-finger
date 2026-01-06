"use client";

import { ArrowRightLeft, History, Loader2 } from "lucide-react";

import { ExchangeRateHistory } from "./exchange-rate-history";
import { CURRENCIES } from "@/lib/constants";
import { useExchangeRate } from "@/hooks/use-exchange-rate";

interface ExchangeRateDisplayProps {
  fromCurrency: string;
  toCurrency: string;
  amount: number;
}

export function ExchangeRateDisplay({
  fromCurrency,
  toCurrency,
  amount,
}: ExchangeRateDisplayProps) {
  // Use 1 as default for display when no amount entered
  const displayAmount = amount || 1;

  const {
    rate: exchangeRate,
    convertedAmount,
    isLoading,
    error,
  } = useExchangeRate({
    fromCurrency,
    toCurrency,
    amount: displayAmount,
    enabled: fromCurrency !== toCurrency,
  });

  // Don't render if same currency
  if (fromCurrency === toCurrency) {
    return null;
  }

  const fromSymbol = CURRENCIES.find((c) => c.code === fromCurrency)?.symbol || fromCurrency;
  const toSymbol = CURRENCIES.find((c) => c.code === toCurrency)?.symbol || toCurrency;

  return (
    <div className="rounded-lg border bg-muted/50 p-3 space-y-1">
      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Fetching exchange rate...
        </div>
      ) : exchangeRate && convertedAmount ? (
        <>
          <div className="flex items-center gap-2 text-sm">
            <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
            <span>
              {fromSymbol}
              {displayAmount.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              ={" "}
              <strong>
                {toSymbol}
                {convertedAmount.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </strong>
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Rate: 1 {fromCurrency} = {exchangeRate.toFixed(4)} {toCurrency}
            </span>
            <div className="flex items-center gap-2">
              <ExchangeRateHistory
                fromCurrency={fromCurrency}
                toCurrency={toCurrency}
                trigger={
                  <button
                    type="button"
                    className="flex items-center gap-1 hover:underline"
                  >
                    <History className="h-3 w-3" />
                    History
                  </button>
                }
              />
              <span className="text-muted-foreground/50">|</span>
              <a
                href="https://frankfurter.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                ECB
              </a>
            </div>
          </div>
        </>
      ) : error ? (
        <div className="text-sm text-destructive">
          Could not fetch exchange rate. Rate will be calculated on save.
        </div>
      ) : null}
    </div>
  );
}
