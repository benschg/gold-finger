"use client";

import { useFetch } from "./use-fetch";
import type { Tag } from "@/types/database";

export function useTags(accountId: string | null) {
  const { data, isLoading, error, refetch } = useFetch<Tag[]>(
    accountId ? `/api/tags?account_id=${accountId}` : null,
  );

  return {
    tags: data ?? [],
    isLoading,
    error,
    refetch,
  };
}
