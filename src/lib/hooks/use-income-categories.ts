"use client";

import { useFetch } from "./use-fetch";
import type { IncomeCategory } from "@/types/database";

export function useIncomeCategories(accountId: string | null) {
  const { data, isLoading, error, refetch } = useFetch<IncomeCategory[]>(
    accountId ? `/api/income-categories?account_id=${accountId}` : null,
  );

  return {
    incomeCategories: data ?? [],
    isLoading,
    error,
    refetch,
  };
}
