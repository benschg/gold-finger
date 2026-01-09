"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { format, subDays, subMonths, startOfYear } from "date-fns";
import { CalendarIcon, ChevronDown, Loader2 } from "lucide-react";
import type { DateRange as DayPickerDateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAccountStore } from "@/store/account-store";
import { CURRENCIES } from "@/lib/constants";
import type { Currency } from "@/types/database";

interface FakeDataDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type DatePreset = "7D" | "30D" | "90D" | "YTD" | "1Y" | "custom";

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: "7D", label: "7 Days" },
  { value: "30D", label: "30 Days" },
  { value: "90D", label: "90 Days" },
  { value: "YTD", label: "Year to Date" },
  { value: "1Y", label: "1 Year" },
];

function getDateRangeFromPreset(preset: DatePreset): {
  start: Date;
  end: Date;
} {
  const end = new Date();
  let start: Date;

  switch (preset) {
    case "7D":
      start = subDays(end, 7);
      break;
    case "30D":
      start = subDays(end, 30);
      break;
    case "90D":
      start = subDays(end, 90);
      break;
    case "YTD":
      start = startOfYear(end);
      break;
    case "1Y":
      start = subMonths(end, 12);
      break;
    default:
      start = subDays(end, 30);
  }

  return { start, end };
}

export function FakeDataDialog({
  open,
  onOpenChange,
  onSuccess,
}: FakeDataDialogProps) {
  const t = useTranslations("devTools.fakeData");
  const tDateRange = useTranslations("dateRange");
  const tc = useTranslations("common");
  const { selectedAccountId } = useAccountStore();

  // Separate loading/status states for each type
  const [isGeneratingExpenses, setIsGeneratingExpenses] = useState(false);
  const [isGeneratingIncome, setIsGeneratingIncome] = useState(false);
  const [expenseResult, setExpenseResult] = useState<{
    success?: string;
    error?: string;
  } | null>(null);
  const [incomeResult, setIncomeResult] = useState<{
    success?: string;
    error?: string;
  } | null>(null);

  // Date range state
  const [datePreset, setDatePreset] = useState<DatePreset>("30D");
  const [customRange, setCustomRange] = useState<
    DayPickerDateRange | undefined
  >();
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Currency state ("default" means use account currency)
  const [currency, setCurrency] = useState<Currency | "default">("default");

  // Expenses state
  const [expenseCount, setExpenseCount] = useState(10);
  const [expenseTotalAmount, setExpenseTotalAmount] = useState(1000);

  // Income state
  const [incomeCount, setIncomeCount] = useState(5);
  const [incomeTotalAmount, setIncomeTotalAmount] = useState(3000);

  const getDateRange = () => {
    if (datePreset === "custom" && customRange?.from) {
      return {
        start: customRange.from,
        end: customRange.to || customRange.from,
      };
    }
    return getDateRangeFromPreset(datePreset);
  };

  const handlePresetClick = (preset: DatePreset) => {
    if (preset === "custom") {
      const range = getDateRangeFromPreset("30D");
      setCustomRange({ from: range.start, to: range.end });
      setCalendarOpen(true);
    }
    setDatePreset(preset);
  };

  const handleApplyCustomRange = () => {
    setCalendarOpen(false);
  };

  const getDateDisplayText = () => {
    const { start, end } = getDateRange();
    if (datePreset === "custom") {
      return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
    }
    const preset = DATE_PRESETS.find((p) => p.value === datePreset);
    return preset?.label || "30 Days";
  };

  const generateExpenses = async () => {
    if (!selectedAccountId) {
      setExpenseResult({ error: t("noAccountSelected") });
      return;
    }

    if (expenseCount <= 0 || expenseTotalAmount <= 0) {
      return;
    }

    const { start, end } = getDateRange();
    setExpenseResult(null);
    setIsGeneratingExpenses(true);

    try {
      const response = await fetch("/api/dev/fake-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account_id: selectedAccountId,
          startDate: format(start, "yyyy-MM-dd"),
          endDate: format(end, "yyyy-MM-dd"),
          currency: currency === "default" ? undefined : currency,
          expenseCount,
          expenseTotalAmount,
          incomeCount: 0,
          incomeTotalAmount: 0,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setExpenseResult({
          success: `Created ${data.createdExpenses} expenses`,
        });
        onSuccess?.();
      } else {
        const data = await response.json();
        setExpenseResult({
          error: data.error || "Failed to generate expenses",
        });
      }
    } catch (err) {
      console.error("Error generating expenses:", err);
      setExpenseResult({ error: "Failed to generate expenses" });
    } finally {
      setIsGeneratingExpenses(false);
    }
  };

  const generateIncome = async () => {
    if (!selectedAccountId) {
      setIncomeResult({ error: t("noAccountSelected") });
      return;
    }

    if (incomeCount <= 0 || incomeTotalAmount <= 0) {
      return;
    }

    const { start, end } = getDateRange();
    setIncomeResult(null);
    setIsGeneratingIncome(true);

    try {
      const response = await fetch("/api/dev/fake-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account_id: selectedAccountId,
          startDate: format(start, "yyyy-MM-dd"),
          endDate: format(end, "yyyy-MM-dd"),
          currency: currency === "default" ? undefined : currency,
          expenseCount: 0,
          expenseTotalAmount: 0,
          incomeCount,
          incomeTotalAmount,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.incomeError) {
          setIncomeResult({ error: `DB Error: ${data.incomeError}` });
        } else if (data.createdIncomes === 0) {
          setIncomeResult({
            error: "No income entries created (unknown error)",
          });
        } else {
          setIncomeResult({
            success: `Created ${data.createdIncomes} income entries`,
          });
          onSuccess?.();
        }
      } else {
        const data = await response.json();
        setIncomeResult({ error: data.error || "Failed to generate income" });
      }
    } catch (err) {
      console.error("Error generating income:", err);
      setIncomeResult({ error: "Failed to generate income" });
    } finally {
      setIsGeneratingIncome(false);
    }
  };

  const handleClose = () => {
    setExpenseResult(null);
    setIncomeResult(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Date Range Picker */}
          <div className="space-y-2">
            <Label>{t("dateRange")}</Label>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex-1 justify-between">
                    <span className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      {getDateDisplayText()}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  {DATE_PRESETS.map((preset) => (
                    <DropdownMenuItem
                      key={preset.value}
                      onClick={() => handlePresetClick(preset.value)}
                      className={cn(datePreset === preset.value && "bg-accent")}
                    >
                      {preset.label}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuItem
                    onClick={() => handlePresetClick("custom")}
                    className={cn(datePreset === "custom" && "bg-accent")}
                  >
                    {tDateRange("customRange")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Custom Date Range Calendar */}
            {datePreset === "custom" && (
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full mt-2">
                    {customRange?.from && customRange?.to
                      ? `${format(customRange.from, "MMM d, yyyy")} - ${format(customRange.to, "MMM d, yyyy")}`
                      : "Select dates"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={customRange}
                    onSelect={setCustomRange}
                    numberOfMonths={2}
                  />
                  <div className="flex justify-end gap-2 p-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCalendarOpen(false)}
                    >
                      {tc("cancel")}
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleApplyCustomRange}
                      disabled={!customRange?.from}
                    >
                      {tc("apply")}
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>

          {/* Currency Selector */}
          <div className="space-y-2">
            <Label>{t("currency")}</Label>
            <Select
              value={currency}
              onValueChange={(v) => setCurrency(v as Currency | "default")}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("useAccountCurrency")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">
                  {t("useAccountCurrency")}
                </SelectItem>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.symbol} {c.label} ({c.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Expenses Section */}
          <div className="space-y-3 rounded-lg border p-3">
            <Label className="font-medium">{t("expensesSection")}</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label
                  htmlFor="expense-count"
                  className="text-xs text-muted-foreground"
                >
                  {t("count")}
                </Label>
                <Input
                  id="expense-count"
                  type="number"
                  min={1}
                  max={100}
                  value={expenseCount}
                  onChange={(e) => setExpenseCount(Number(e.target.value))}
                />
              </div>
              <div className="space-y-1">
                <Label
                  htmlFor="expense-amount"
                  className="text-xs text-muted-foreground"
                >
                  {t("totalAmount")}
                </Label>
                <Input
                  id="expense-amount"
                  type="number"
                  min={1}
                  step={0.01}
                  value={expenseTotalAmount}
                  onChange={(e) =>
                    setExpenseTotalAmount(Number(e.target.value))
                  }
                />
              </div>
            </div>
            {expenseResult?.error && (
              <div className="text-xs text-destructive">
                {expenseResult.error}
              </div>
            )}
            {expenseResult?.success && (
              <div className="text-xs text-green-600 dark:text-green-400">
                {expenseResult.success}
              </div>
            )}
            <Button
              type="button"
              size="sm"
              className="w-full"
              onClick={generateExpenses}
              disabled={
                isGeneratingExpenses ||
                !selectedAccountId ||
                expenseCount <= 0 ||
                expenseTotalAmount <= 0
              }
            >
              {isGeneratingExpenses && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isGeneratingExpenses ? t("generating") : t("generate")}
            </Button>
          </div>

          {/* Income Section */}
          <div className="space-y-3 rounded-lg border p-3">
            <Label className="font-medium">{t("incomeSection")}</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label
                  htmlFor="income-count"
                  className="text-xs text-muted-foreground"
                >
                  {t("count")}
                </Label>
                <Input
                  id="income-count"
                  type="number"
                  min={1}
                  max={100}
                  value={incomeCount}
                  onChange={(e) => setIncomeCount(Number(e.target.value))}
                />
              </div>
              <div className="space-y-1">
                <Label
                  htmlFor="income-amount"
                  className="text-xs text-muted-foreground"
                >
                  {t("totalAmount")}
                </Label>
                <Input
                  id="income-amount"
                  type="number"
                  min={1}
                  step={0.01}
                  value={incomeTotalAmount}
                  onChange={(e) => setIncomeTotalAmount(Number(e.target.value))}
                />
              </div>
            </div>
            {incomeResult?.error && (
              <div className="text-xs text-destructive">
                {incomeResult.error}
              </div>
            )}
            {incomeResult?.success && (
              <div className="text-xs text-green-600 dark:text-green-400">
                {incomeResult.success}
              </div>
            )}
            <Button
              type="button"
              size="sm"
              className="w-full"
              onClick={generateIncome}
              disabled={
                isGeneratingIncome ||
                !selectedAccountId ||
                incomeCount <= 0 ||
                incomeTotalAmount <= 0
              }
            >
              {isGeneratingIncome && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isGeneratingIncome ? t("generating") : t("generate")}
            </Button>
          </div>

          {/* Close Button */}
          <div className="flex justify-end pt-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              {tc("close")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
