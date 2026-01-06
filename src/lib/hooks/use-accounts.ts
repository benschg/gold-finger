"use client";

import { useFetch } from "./use-fetch";
import type { AccountWithRole } from "@/types/database";

export function useAccounts() {
  const { data, isLoading, error, refetch } = useFetch<AccountWithRole[]>(
    "/api/accounts"
  );

  return {
    accounts: data ?? [],
    isLoading,
    error,
    refetch,
  };
}
