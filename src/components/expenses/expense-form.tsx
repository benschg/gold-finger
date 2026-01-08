"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Sparkles } from "lucide-react";
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
import { ReceiptUpload } from "./receipt-upload";
import { ExchangeRateDisplay } from "./exchange-rate-display";
import { CURRENCIES, DEFAULT_CURRENCY } from "@/lib/constants";
import type {
  Account,
  Category,
  Tag,
  ExpenseWithDetails,
  Currency,
} from "@/types/database";

const createExpenseSchema = (
  t: ReturnType<typeof useTranslations<"expenses">>,
) =>
  z.object({
    amount: z.number().positive(t("amountMustBePositive")),
    currency: z.string().min(1, t("currencyRequired")),
    description: z.string().optional(),
    date: z.string().min(1),
    category_id: z.string().optional(),
  });

type ExpenseFormData = {
  amount: number;
  currency: string;
  description?: string;
  date: string;
  category_id?: string;
};

interface ExpenseFormProps {
  accountId: string;
  accounts: Account[];
  accountCurrency?: Currency;
  categories: Category[];
  tags: Tag[];
  expense?: ExpenseWithDetails;
  onSuccess?: () => void;
  onCancel?: () => void;
  onAccountChange?: (accountId: string) => void;
  onAddAnother?: () => void;
}

export function ExpenseForm({
  accountId,
  accounts,
  accountCurrency = DEFAULT_CURRENCY,
  categories,
  tags,
  expense,
  onSuccess,
  onCancel,
  onAccountChange,
  onAddAnother,
}: ExpenseFormProps) {
  const t = useTranslations("expenses");
  const tCommon = useTranslations("common");

  const [selectedAccountId, setSelectedAccountId] = useState(accountId);
  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);
  const effectiveAccountCurrency =
    (selectedAccount?.currency as Currency) || accountCurrency;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const addAnotherRef = useRef(false);
  const [selectedTags, setSelectedTags] = useState<string[]>(
    expense?.tags?.map((tag) => tag.id) || [],
  );
  const [receiptUrl, setReceiptUrl] = useState<string | null>(
    expense?.receipt_url || null,
  );
  const [aiAutoFilled, setAiAutoFilled] = useState(false);

  const expenseSchema = createExpenseSchema(t);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: expense?.amount || undefined,
      currency: expense?.currency || accountCurrency,
      description: expense?.description || "",
      date: expense?.date || format(new Date(), "yyyy-MM-dd"),
      category_id: expense?.category_id || undefined,
    },
  });

  const selectedCurrency = watch("currency");
  const watchedAmount = watch("amount");

  const handleAccountChange = (newAccountId: string) => {
    setSelectedAccountId(newAccountId);
    onAccountChange?.(newAccountId);
  };

  const onSubmit = async (data: ExpenseFormData) => {
    setIsSubmitting(true);
    try {
      const url = expense ? `/api/expenses/${expense.id}` : "/api/expenses";
      const method = expense ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          account_id: selectedAccountId,
          tag_ids: selectedTags,
          category_id: data.category_id || null,
          receipt_url: receiptUrl,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save expense");
      }

      if (addAnotherRef.current) {
        // Reset form for another entry
        setValue("amount", undefined as unknown as number);
        setValue("description", "");
        setValue("category_id", undefined);
        setSelectedTags([]);
        setReceiptUrl(null);
        setAiAutoFilled(false);
        addAnotherRef.current = false;
        onAddAnother?.();
      } else {
        onSuccess?.();
      }
    } catch (error) {
      console.error("Error saving expense:", error);
      addAnotherRef.current = false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddAnother = () => {
    addAnotherRef.current = true;
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId],
    );
  };

  const handleReceiptAnalysis = (data: {
    amount?: number;
    currency?: string;
    date?: string;
    description?: string;
    merchant?: string;
    category?: string;
  }) => {
    // Auto-fill form with AI-extracted data
    if (data.amount) {
      setValue("amount", data.amount);
    }
    if (data.currency && CURRENCIES.some((c) => c.code === data.currency)) {
      setValue("currency", data.currency);
    }
    if (data.date) {
      setValue("date", data.date);
    }
    if (data.description || data.merchant) {
      const desc = data.merchant
        ? data.description
          ? `${data.merchant} - ${data.description}`
          : data.merchant
        : data.description;
      if (desc) setValue("description", desc);
    }
    // Try to match category by name
    if (data.category) {
      const matchedCategory = categories.find(
        (c) => c.name.toLowerCase() === data.category?.toLowerCase(),
      );
      if (matchedCategory) {
        setValue("category_id", matchedCategory.id);
      }
    }
    setAiAutoFilled(true);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Account Selector */}
      {accounts.length > 1 && (
        <div className="space-y-2">
          <Label htmlFor="account">{t("account")}</Label>
          <Select value={selectedAccountId} onValueChange={handleAccountChange}>
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

      {/* Receipt Upload */}
      <div className="space-y-2">
        <Label>{t("receipt")}</Label>
        <ReceiptUpload
          existingUrl={expense?.receipt_url || undefined}
          onUploadComplete={(url) => setReceiptUrl(url)}
          onAnalysisComplete={handleReceiptAnalysis}
        />
        {aiAutoFilled && (
          <div className="flex items-center gap-2 text-sm text-primary">
            <Sparkles className="h-4 w-4" />
            {t("formAutoFilled")}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{t("description")}</Label>
        <Input
          id="description"
          placeholder={t("descriptionPlaceholder")}
          {...register("description")}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="amount">{t("amount")}</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {CURRENCIES.find((c) => c.code === selectedCurrency)?.symbol}
            </span>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              className={
                (CURRENCIES.find((c) => c.code === selectedCurrency)?.symbol
                  ?.length ?? 1) > 2
                  ? "pl-14"
                  : "pl-8"
              }
              {...register("amount", { valueAsNumber: true })}
            />
          </div>
          {errors.amount && (
            <p className="text-sm text-destructive">{errors.amount.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="currency">{t("currency")}</Label>
          <Select
            defaultValue={expense?.currency || accountCurrency}
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
      </div>

      {/* Exchange rate conversion info */}
      <ExchangeRateDisplay
        fromCurrency={selectedCurrency}
        toCurrency={effectiveAccountCurrency}
        amount={watchedAmount || 0}
      />

      <div className="grid gap-4 sm:grid-cols-2">
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
          <Label htmlFor="category">{t("category")}</Label>
          <Select
            defaultValue={expense?.category_id || "none"}
            onValueChange={(value) =>
              setValue("category_id", value === "none" ? undefined : value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder={t("selectCategory")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t("noCategory")}</SelectItem>
              {categories.map((category) => (
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

      {tags.length > 0 && (
        <div className="space-y-2">
          <Label>{t("tags")}</Label>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id)}
                className={`rounded-full px-3 py-1 text-sm transition-colors ${
                  selectedTags.includes(tag.id)
                    ? "text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
                style={
                  selectedTags.includes(tag.id)
                    ? { backgroundColor: tag.color ?? "#6366f1" }
                    : undefined
                }
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            {tCommon("cancel")}
          </Button>
        )}
        {onAddAnother && !expense && (
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
          {expense ? t("updateExpense") : t("addExpense")}
        </Button>
      </div>
    </form>
  );
}
