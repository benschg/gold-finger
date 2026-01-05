"use client";

import { useState, useEffect } from "react";
import type { Category } from "@/types/database";

export function useCategories(accountId: string | null) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    if (!accountId) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/categories?account_id=${accountId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }
      const data = await response.json();
      setCategories(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [accountId]);

  return { categories, isLoading, error, refetch: fetchCategories };
}
