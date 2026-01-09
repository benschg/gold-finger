"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { AlertTriangle, CalendarIcon, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { IconBadge } from "@/components/ui/icon-picker";

import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { FrequencySelector } from "./frequency-selector";
import { DayOfWeekPicker } from "./day-of-week-picker";
import { DayOfMonthPicker } from "./day-of-month-picker";
import {
  CURRENCIES,
  DEFAULT_CURRENCY,
  getCurrencySymbol,
} from "@/lib/constants";
import { previewOccurrences } from "@/lib/recurrence";
import type {
  Account,
  IncomeCategory,
  RecurringIncomeWithCategory,
  Currency,
  RecurrenceFrequency,
  CustomUnit,
} from "@/types/database";

const createRecurringIncomeFormSchema = (
  t: ReturnType<typeof useTranslations<"recurring">>,
) =>
  z.object({
    amount: z.number().positive(t("amountMustBePositive")),
    currency: z.string().min(1),
    summary: z.string().max(100).optional(),
    description: z.string().max(500).optional(),
    income_category_id: z.string().optional(),
    frequency: z.enum([
      "daily",
      "weekly",
      "biweekly",
      "monthly",
      "quarterly",
      "yearly",
      "custom",
    ]),
    custom_interval: z.number().int().positive().optional(),
    custom_unit: z.enum(["days", "weeks", "months", "years"]).optional(),
    day_of_week_mask: z.number().int().min(0).max(127).optional(),
    day_of_month: z.number().int().optional().nullable(),
    start_date: z.string().min(1),
    end_date: z.string().optional().nullable(),
  });

type RecurringIncomeFormData = {
  amount: number;
  currency: string;
  summary?: string;
  description?: string;
  income_category_id?: string;
  frequency: RecurrenceFrequency;
  custom_interval?: number;
  custom_unit?: CustomUnit;
  day_of_week_mask?: number;
  day_of_month?: number | null;
  start_date: string;
  end_date?: string | null;
};

interface RecurringIncomeFormProps {
  accountId: string;
  accounts: Account[];
  accountCurrency?: Currency;
  incomeCategories: IncomeCategory[];
  recurringIncome?: RecurringIncomeWithCategory;
  onSuccess?: () => void;
  onCancel?: () => void;
  onAccountChange?: (accountId: string) => void;
}

export function RecurringIncomeForm({
  accountId,
  accounts,
  accountCurrency = DEFAULT_CURRENCY,
  incomeCategories,
  recurringIncome,
  onSuccess,
  onCancel,
  onAccountChange,
}: RecurringIncomeFormProps) {
  const t = useTranslations("recurring");
  const tCommon = useTranslations("common");

  const [selectedAccountId, setSelectedAccountId] = useState(accountId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formSchema = createRecurringIncomeFormSchema(t);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RecurringIncomeFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: recurringIncome?.amount || 0,
      currency: recurringIncome?.currency || accountCurrency,
      summary: recurringIncome?.summary || "",
      description: recurringIncome?.description || "",
      income_category_id: recurringIncome?.income_category_id || undefined,
      frequency: recurringIncome?.frequency || "monthly",
      custom_interval: recurringIncome?.custom_interval || 1,
      custom_unit: recurringIncome?.custom_unit || "days",
      day_of_week_mask: recurringIncome?.day_of_week_mask || 0,
      day_of_month: recurringIncome?.day_of_month || null,
      start_date:
        recurringIncome?.start_date || format(new Date(), "yyyy-MM-dd"),
      end_date: recurringIncome?.end_date || null,
    },
  });

  const selectedCurrency = watch("currency");
  const frequency = watch("frequency");
  const customInterval = watch("custom_interval");
  const customUnit = watch("custom_unit");
  const dayOfWeekMask = watch("day_of_week_mask");
  const dayOfMonth = watch("day_of_month");
  const startDate = watch("start_date");
  const endDate = watch("end_date");

  // Calculate preview occurrences
  const previewDates =
    startDate && frequency
      ? previewOccurrences(
          {
            frequency,
            customInterval,
            customUnit,
            dayOfWeekMask,
            dayOfMonth: dayOfMonth ?? undefined,
            startDate: new Date(startDate),
            endDate: endDate ? new Date(endDate) : undefined,
          },
          5,
        )
      : [];

  // Calculate how many occurrences are in the past (only for new recurring incomes)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const pastOccurrencesCount =
    !recurringIncome && previewDates.length > 0
      ? previewDates.filter((d) => d <= today).length
      : 0;

  const handleAccountChange = (newAccountId: string) => {
    setSelectedAccountId(newAccountId);
    onAccountChange?.(newAccountId);
  };

  const onSubmit = async (data: RecurringIncomeFormData) => {
    setIsSubmitting(true);
    try {
      const url = recurringIncome
        ? `/api/recurring-incomes/${recurringIncome.id}`
        : "/api/recurring-incomes";
      const method = recurringIncome ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          account_id: selectedAccountId,
          income_category_id: data.income_category_id || null,
          end_date: data.end_date || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save recurring income");
      }

      onSuccess?.();
    } catch (error) {
      console.error("Error saving recurring income:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const showDayOfWeekPicker = frequency === "weekly";
  const showDayOfMonthPicker = ["monthly", "quarterly", "yearly"].includes(
    frequency,
  );

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

        {/* Currency / Category row */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="currency">{t("currency")}</Label>
            <Select
              defaultValue={recurringIncome?.currency || accountCurrency}
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">{t("category")}</Label>
            <Select
              defaultValue={recurringIncome?.income_category_id || "none"}
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

        {/* Summary */}
        <div className="space-y-2">
          <Label htmlFor="summary">{t("summary")}</Label>
          <Input
            id="summary"
            placeholder={t("summaryPlaceholder")}
            maxLength={100}
            {...register("summary")}
          />
        </div>

        {/* Frequency */}
        <FrequencySelector
          value={frequency}
          onChange={(v) => setValue("frequency", v)}
          customInterval={customInterval}
          customUnit={customUnit}
          onCustomIntervalChange={(v) => setValue("custom_interval", v)}
          onCustomUnitChange={(v) => setValue("custom_unit", v)}
        />

        {/* Day of Week Picker (for weekly) */}
        {showDayOfWeekPicker && (
          <DayOfWeekPicker
            value={dayOfWeekMask || 0}
            onChange={(v) => setValue("day_of_week_mask", v)}
          />
        )}

        {/* Day of Month Picker (for monthly/quarterly/yearly) */}
        {showDayOfMonthPicker && (
          <DayOfMonthPicker
            value={dayOfMonth}
            onChange={(v) => setValue("day_of_month", v)}
          />
        )}

        {/* Start / End Date */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="start_date">{t("startDate")}</Label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="start_date"
                type="date"
                className="pl-10"
                {...register("start_date")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="end_date">{t("endDateOptional")}</Label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="end_date"
                type="date"
                className="pl-10"
                {...register("end_date")}
              />
            </div>
          </div>
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

        {/* Preview Occurrences */}
        {previewDates.length > 0 && (
          <div className="space-y-2">
            <Label>{t("upcomingOccurrences")}</Label>
            <div className="rounded-md border p-3">
              <ul className="space-y-1 text-sm text-muted-foreground">
                {previewDates.map((date, index) => (
                  <li key={index}>{format(date, "PPP")}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Past Occurrences Warning */}
        {pastOccurrencesCount > 0 && (
          <Alert
            variant="default"
            className="border-amber-500 bg-amber-50 dark:bg-amber-950/20"
          >
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              <p className="font-medium">
                {t("pastOccurrencesWarning", { count: pastOccurrencesCount })}
              </p>
              <p className="mt-1 text-sm opacity-80">
                {t("pastOccurrencesInfo")}
              </p>
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Fixed button area */}
      <div className="flex shrink-0 justify-end gap-2 border-t bg-background pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            {tCommon("cancel")}
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {recurringIncome ? t("updateRecurring") : t("addRecurring")}
        </Button>
      </div>
    </form>
  );
}
