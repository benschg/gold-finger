"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { IconBadge } from "@/components/ui/icon-picker";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ExchangeRateDisplay } from "@/components/expenses/exchange-rate-display";
import {
  CURRENCIES,
  DEFAULT_CURRENCY,
  getCurrencySymbol,
} from "@/lib/constants";
import type {
  Account,
  IncomeCategory,
  IncomeWithCategory,
  Currency,
} from "@/types/database";

const createIncomeSchema = (t: ReturnType<typeof useTranslations<"income">>) =>
  z.object({
    amount: z.number().positive(t("amountMustBePositive")),
    currency: z.string().min(1, t("currencyRequired")),
    description: z.string().max(500).optional(),
    date: z.string().min(1),
    income_category_id: z.string().optional(),
  });

type IncomeFormData = {
  amount: number;
  currency: string;
  description?: string;
  date: string;
  income_category_id?: string;
};

interface IncomeFormProps {
  accountId: string;
  accounts: Account[];
  accountCurrency?: Currency;
  incomeCategories: IncomeCategory[];
  income?: IncomeWithCategory;
  onSuccess?: () => void;
  onCancel?: () => void;
  onAccountChange?: (accountId: string) => void;
  onAddAnother?: () => void;
}

export function IncomeForm({
  accountId,
  accounts,
  accountCurrency = DEFAULT_CURRENCY,
  incomeCategories,
  income,
  onSuccess,
  onCancel,
  onAccountChange,
  onAddAnother,
}: IncomeFormProps) {
  const t = useTranslations("income");
  const tCommon = useTranslations("common");

  const [selectedAccountId, setSelectedAccountId] = useState(accountId);
  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);
  const effectiveAccountCurrency =
    (selectedAccount?.currency as Currency) || accountCurrency;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const addAnotherRef = useRef(false);

  const incomeSchema = createIncomeSchema(t);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<IncomeFormData>({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      amount: income?.amount || 0,
      currency: income?.currency || accountCurrency,
      description: income?.description || "",
      date: income?.date || format(new Date(), "yyyy-MM-dd"),
      income_category_id: income?.income_category_id || undefined,
    },
  });

  const selectedCurrency = watch("currency");
  const amount = watch("amount");

  const handleAccountChange = (newAccountId: string) => {
    setSelectedAccountId(newAccountId);
    onAccountChange?.(newAccountId);
  };

  const onSubmit = async (data: IncomeFormData) => {
    setIsSubmitting(true);
    try {
      const url = income ? `/api/incomes/${income.id}` : "/api/incomes";
      const method = income ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          account_id: selectedAccountId,
          income_category_id: data.income_category_id || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save income");
      }

      if (addAnotherRef.current) {
        // Reset form for another entry
        setValue("amount", 0);
        setValue("description", "");
        setValue("income_category_id", undefined);
        addAnotherRef.current = false;
        onAddAnother?.();
      } else {
        onSuccess?.();
      }
    } catch (error) {
      console.error("Error saving income:", error);
      addAnotherRef.current = false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddAnother = () => {
    addAnotherRef.current = true;
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex min-h-0 flex-1 flex-col"
    >
      {/* Scrollable content area */}
      <div className="scrollbar-thin min-h-0 flex-1 space-y-4 overflow-y-auto pr-2">
        {/* Account Selector */}
        {accounts.length > 1 && (
          <div className="space-y-2">
            <Label htmlFor="account">{t("account")}</Label>
            <Select
              value={selectedAccountId}
              onValueChange={handleAccountChange}
            >
              <SelectTrigger id="account">
                <SelectValue placeholder={t("selectAccount")} />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    <div className="flex items-center gap-2">
                      <IconBadge
                        icon={account.icon ?? "wallet"}
                        color={account.color ?? "#6366f1"}
                        size="xs"
                      />
                      {account.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Date / Currency / Category row */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="date">{t("date")}</Label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="date"
                type="date"
                className="pl-10"
                {...register("date")}
              />
            </div>
            {errors.date && (
              <p className="text-sm text-destructive">{errors.date.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">{t("currency")}</Label>
            <Select
              defaultValue={income?.currency || accountCurrency}
              onValueChange={(value) => setValue("currency", value)}
            >
              <SelectTrigger>
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
            {errors.currency && (
              <p className="text-sm text-destructive">
                {errors.currency.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">{t("category")}</Label>
            <Select
              defaultValue={income?.income_category_id || "none"}
              onValueChange={(value) =>
                setValue(
                  "income_category_id",
                  value === "none" ? undefined : value,
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={t("selectCategory")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("noCategory")}</SelectItem>
                {incomeCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <span className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      {category.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Amount */}
        <div className="space-y-2">
          <Label htmlFor="amount">{t("amount")}</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              {getCurrencySymbol(selectedCurrency)}
            </span>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              className="pl-8"
              {...register("amount", { valueAsNumber: true })}
            />
          </div>
          {errors.amount && (
            <p className="text-sm text-destructive">{errors.amount.message}</p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">{t("description")}</Label>
          <textarea
            id="description"
            placeholder={t("descriptionPlaceholder")}
            className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            maxLength={500}
            {...register("description")}
          />
        </div>

        {/* Exchange rate conversion info */}
        <ExchangeRateDisplay
          fromCurrency={selectedCurrency}
          toCurrency={effectiveAccountCurrency}
          amount={amount || 0}
        />
      </div>

      {/* Fixed button area */}
      <div className="flex shrink-0 justify-end gap-2 border-t bg-background pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            {tCommon("cancel")}
          </Button>
        )}
        {onAddAnother && !income && (
          <Button
            type="submit"
            variant="secondary"
            disabled={isSubmitting}
            onClick={handleAddAnother}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("addAndNew")}
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {income ? t("updateIncome") : t("addIncome")}
        </Button>
      </div>
    </form>
  );
}
