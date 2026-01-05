"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Sparkles } from "lucide-react";

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
import type { Tables } from "@/types/database.types";

type Category = Tables<"categories">;
type Tag = Tables<"tags">;
type ExpenseWithDetails = Tables<"expenses"> & {
  category?: Category | null;
  tags?: Tag[];
};

const currencies = [
  { value: "EUR", label: "Euro", symbol: "€" },
  { value: "USD", label: "US Dollar", symbol: "$" },
  { value: "GBP", label: "British Pound", symbol: "£" },
  { value: "CHF", label: "Swiss Franc", symbol: "CHF" },
  { value: "JPY", label: "Japanese Yen", symbol: "¥" },
  { value: "CAD", label: "Canadian Dollar", symbol: "C$" },
  { value: "AUD", label: "Australian Dollar", symbol: "A$" },
];

const expenseSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  currency: z.string().min(1, "Currency is required"),
  description: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  category_id: z.string().optional(),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

interface ExpenseFormProps {
  accountId: string;
  categories: Category[];
  tags: Tag[];
  expense?: ExpenseWithDetails;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ExpenseForm({
  accountId,
  categories,
  tags,
  expense,
  onSuccess,
  onCancel,
}: ExpenseFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>(
    expense?.tags?.map((t) => t.id) || []
  );
  const [receiptUrl, setReceiptUrl] = useState<string | null>(
    expense?.receipt_url || null
  );
  const [aiAutoFilled, setAiAutoFilled] = useState(false);

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
      currency: expense?.currency || "EUR",
      description: expense?.description || "",
      date: expense?.date || format(new Date(), "yyyy-MM-dd"),
      category_id: expense?.category_id || undefined,
    },
  });

  const selectedCurrency = watch("currency");

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
          account_id: accountId,
          tag_ids: selectedTags,
          category_id: data.category_id || null,
          receipt_url: receiptUrl,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save expense");
      }

      onSuccess?.();
    } catch (error) {
      console.error("Error saving expense:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
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
    if (data.currency && currencies.some((c) => c.value === data.currency)) {
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
        (c) => c.name.toLowerCase() === data.category?.toLowerCase()
      );
      if (matchedCategory) {
        setValue("category_id", matchedCategory.id);
      }
    }
    setAiAutoFilled(true);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Receipt Upload */}
      <div className="space-y-2">
        <Label>Receipt (optional)</Label>
        <ReceiptUpload
          existingUrl={expense?.receipt_url || undefined}
          onUploadComplete={(url) => setReceiptUrl(url)}
          onAnalysisComplete={handleReceiptAnalysis}
        />
        {aiAutoFilled && (
          <div className="flex items-center gap-2 text-sm text-primary">
            <Sparkles className="h-4 w-4" />
            Form auto-filled from receipt
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {currencies.find((c) => c.value === selectedCurrency)?.symbol}
            </span>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              className="pl-8"
              {...register("amount", { valueAsNumber: true })}
            />
          </div>
          {errors.amount && (
            <p className="text-sm text-destructive">{errors.amount.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <Select
            defaultValue={expense?.currency || "EUR"}
            onValueChange={(value) => setValue("currency", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((currency) => (
                <SelectItem key={currency.value} value={currency.value}>
                  {currency.symbol} {currency.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.currency && (
            <p className="text-sm text-destructive">{errors.currency.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          placeholder="What was this expense for?"
          {...register("description")}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
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
          <Label htmlFor="category">Category</Label>
          <Select
            defaultValue={expense?.category_id || "none"}
            onValueChange={(value) => setValue("category_id", value === "none" ? undefined : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No category</SelectItem>
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
          <Label>Tags</Label>
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
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {expense ? "Update" : "Add"} Expense
        </Button>
      </div>
    </form>
  );
}
