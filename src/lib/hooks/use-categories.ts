"use client";

import { useFetch } from "./use-fetch";
import type { Category } from "@/types/database";

export function useCategories(accountId: string | null) {
  const { data, isLoading, error, refetch } = useFetch<Category[]>(
    accountId ? `/api/categories?account_id=${accountId}` : null,
  );

  return {
    categories: data ?? [],
    isLoading,
    error,
    refetch,
  };
}
