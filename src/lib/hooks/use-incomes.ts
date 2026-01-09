"use client";

import { useFetch } from "./use-fetch";
import type { IncomeWithCategory } from "@/types/database";

interface UseIncomesOptions {
  startDate?: string;
  endDate?: string;
  incomeCategoryId?: string;
  limit?: number;
  offset?: number;
}

export function useIncomes(
  accountId: string | null,
  options: UseIncomesOptions = {},
) {
  const { startDate, endDate, incomeCategoryId, limit, offset } = options;

  let url: string | null = null;
  if (accountId) {
    const params = new URLSearchParams({ account_id: accountId });
    if (startDate) params.set("start_date", startDate);
    if (endDate) params.set("end_date", endDate);
    if (incomeCategoryId) params.set("income_category_id", incomeCategoryId);
    if (limit) params.set("limit", String(limit));
    if (offset) params.set("offset", String(offset));
    url = `/api/incomes?${params.toString()}`;
  }

  const { data, isLoading, error, refetch } =
    useFetch<IncomeWithCategory[]>(url);

  return {
    incomes: data ?? [],
    isLoading,
    error,
    refetch,
  };
}
