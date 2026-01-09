"use client";

import { forwardRef } from "react";
import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CURRENCIES, getCurrencySymbol } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface AmountCurrencyInputProps {
  /** The amount value */
  amount: number;
  /** The currency code (e.g., "EUR", "USD") */
  currency: string;
  /** Callback when amount changes */
  onAmountChange: (amount: number) => void;
  /** Callback when currency changes */
  onCurrencyChange: (currency: string) => void;
  /** Error message for amount field */
  amountError?: string;
  /** Error message for currency field */
  currencyError?: string;
  /** Label for amount field */
  amountLabel?: string;
  /** Label for currency field */
  currencyLabel?: string;
  /** Placeholder for amount input */
  amountPlaceholder?: string;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Layout orientation */
  layout?: "horizontal" | "vertical";
  /** Additional class name for the container */
  className?: string;
  /** Show currency symbol prefix in amount input */
  showCurrencyPrefix?: boolean;
}

export const AmountCurrencyInput = forwardRef<
  HTMLInputElement,
  AmountCurrencyInputProps
>(
  (
    {
      amount,
      currency,
      onAmountChange,
      onCurrencyChange,
      amountError,
      currencyError,
      amountLabel,
      currencyLabel,
      amountPlaceholder = "0.00",
      disabled = false,
      layout = "horizontal",
      className,
      showCurrencyPrefix = true,
    },
    ref,
  ) => {
    const t = useTranslations("common");

    const containerClass =
      layout === "horizontal"
        ? "grid gap-4 sm:grid-cols-2"
        : "flex flex-col gap-4";

    return (
      <div className={cn(containerClass, className)}>
        {/* Amount Input */}
        <div className="space-y-2">
          {amountLabel && <Label htmlFor="amount">{amountLabel}</Label>}
          <div className="relative">
            {showCurrencyPrefix && (
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                {getCurrencySymbol(currency)}
              </span>
            )}
            <Input
              ref={ref}
              id="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder={amountPlaceholder}
              value={amount || ""}
              onChange={(e) => onAmountChange(parseFloat(e.target.value) || 0)}
              disabled={disabled}
              className={cn(showCurrencyPrefix && "pl-8")}
            />
          </div>
          {amountError && (
            <p className="text-sm text-destructive">{amountError}</p>
          )}
        </div>

        {/* Currency Select */}
        <div className="space-y-2">
          {currencyLabel && <Label htmlFor="currency">{currencyLabel}</Label>}
          <Select
            value={currency}
            onValueChange={onCurrencyChange}
            disabled={disabled}
          >
            <SelectTrigger id="currency">
              <SelectValue placeholder={t("selectCurrency")} />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.symbol} {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {currencyError && (
            <p className="text-sm text-destructive">{currencyError}</p>
          )}
        </div>
      </div>
    );
  },
);

AmountCurrencyInput.displayName = "AmountCurrencyInput";
