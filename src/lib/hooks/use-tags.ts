"use client";

import { useState, useEffect } from "react";
import type { Tag } from "@/types/database";

export function useTags(accountId: string | null) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTags = async () => {
    if (!accountId) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/tags?account_id=${accountId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch tags");
      }
      const data = await response.json();
      setTags(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, [accountId]);

  return { tags, isLoading, error, refetch: fetchTags };
}
