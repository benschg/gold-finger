"use client";

import { useState, useEffect } from "react";
import type { Account } from "@/types/database";

interface AccountWithRole extends Account {
  role: "owner" | "member";
}

export function useAccounts() {
  const [accounts, setAccounts] = useState<AccountWithRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/accounts");
      if (!response.ok) {
        throw new Error("Failed to fetch accounts");
      }
      const data = await response.json();
      setAccounts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  return { accounts, isLoading, error, refetch: fetchAccounts };
}
