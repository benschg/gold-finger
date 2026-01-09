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
import { ExpenseItemEditor } from "./expense-item-editor";
import { CURRENCIES, DEFAULT_CURRENCY } from "@/lib/constants";
import type {
  Account,
  Category,
  Tag,
  ExpenseWithDetails,
  ExpenseWithItems,
  Currency,
  CreateExpenseItemInput,
} from "@/types/database";

const createExpenseSchema = (
  t: ReturnType<typeof useTranslations<"expenses">>,
) =>
  z.object({
    summary: z.string().max(100).optional(),
    currency: z.string().min(1, t("currencyRequired")),
    description: z.string().max(1000).optional(),
    date: z.string().min(1),
    category_id: z.string().optional(),
  });

type ExpenseFormData = {
  summary?: string;
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
  expense?: ExpenseWithDetails | ExpenseWithItems;
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

  // Items state - extract from expense if it has items, otherwise start with one empty item
  const expenseWithItems = expense as ExpenseWithItems | undefined;
  const defaultItem: CreateExpenseItemInput = {
    name: "",
    quantity: 1,
    unit_price: 0,
    category_id: null,
    sort_order: 0,
  };
  const [items, setItems] = useState<CreateExpenseItemInput[]>(
    expenseWithItems?.items?.length
      ? expenseWithItems.items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          category_id: item.category_id,
          sort_order: item.sort_order,
        }))
      : [defaultItem],
  );

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
      summary: expense?.summary || "",
      currency: expense?.currency || accountCurrency,
      description: expense?.description || "",
      date: expense?.date || format(new Date(), "yyyy-MM-dd"),
      category_id: expense?.category_id || undefined,
    },
  });

  const selectedCurrency = watch("currency");

  // Calculate amount from items
  const calculatedAmount = items.reduce(
    (sum, item) => sum + (item.quantity || 1) * (item.unit_price || 0),
    0,
  );

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
          items: items,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save expense");
      }

      if (addAnotherRef.current) {
        // Reset form for another entry
        setValue("summary", "");
        setValue("description", "");
        setValue("category_id", undefined);
        setSelectedTags([]);
        setReceiptUrl(null);
        setAiAutoFilled(false);
        setItems([defaultItem]);
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
    items?: Array<{ name: string; quantity?: number; price?: number }>;
  }) => {
    // Auto-fill form with AI-extracted data
    // Use merchant as summary
    if (data.merchant) {
      setValue("summary", data.merchant);
    }
    if (data.currency && CURRENCIES.some((c) => c.code === data.currency)) {
      setValue("currency", data.currency);
    }
    if (data.date) {
      setValue("date", data.date);
    }
    if (data.description) {
      setValue("description", data.description);
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
    // Auto-fill items from receipt
    if (data.items && data.items.length > 0) {
      const newItems: CreateExpenseItemInput[] = data.items.map(
        (item, index) => ({
          name: item.name,
          quantity: item.quantity || 1,
          unit_price: item.price || 0,
          category_id: null,
          sort_order: index,
        }),
      );
      setItems(newItems);
    }
    setAiAutoFilled(true);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex min-h-0 flex-1 flex-col"
    >
      {/* Scrollable content area */}
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
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

        {/* Summary - short title */}
        <div className="space-y-2">
          <Label htmlFor="summary">{t("summary")}</Label>
          <Input
            id="summary"
            placeholder={t("summaryPlaceholder")}
            maxLength={100}
            {...register("summary")}
          />
        </div>

        {/* Description - longer text */}
        <div className="space-y-2">
          <Label htmlFor="description">{t("description")}</Label>
          <textarea
            id="description"
            placeholder={t("descriptionPlaceholder")}
            className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            maxLength={1000}
            {...register("description")}
          />
        </div>

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

        {/* Line Items */}
        <ExpenseItemEditor
          items={items}
          categories={categories}
          currencySymbol={
            CURRENCIES.find((c) => c.code === selectedCurrency)?.symbol ||
            selectedCurrency
          }
          onChange={setItems}
          expenseCategoryId={watch("category_id")}
        />

        {/* Exchange rate conversion info */}
        <ExchangeRateDisplay
          fromCurrency={selectedCurrency}
          toCurrency={effectiveAccountCurrency}
          amount={calculatedAmount}
        />

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
      </div>

      {/* Fixed button area */}
      <div className="flex shrink-0 justify-end gap-2 border-t bg-background pt-4">
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
