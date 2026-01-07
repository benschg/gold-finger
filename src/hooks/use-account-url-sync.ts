"use client";

import { useEffect, useRef, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useAccountStore } from "@/store/account-store";
import type { AccountWithRole } from "@/types/database";

/**
 * Hook to sync account selection with URL query parameters.
 * Call this in pages that need account-aware URL persistence.
 *
 * @param accounts - List of user's accounts to validate against
 * @returns The currently selected account ID
 */
export function useAccountUrlSync(accounts: AccountWithRole[]) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const isInitialized = useRef(false);
  const lastAccountRef = useRef<string | null>(null);

  const { selectedAccountId, setSelectedAccountId } = useAccountStore();

  // Hydrate store from URL on mount (only once when accounts are loaded)
  useEffect(() => {
    if (isInitialized.current || accounts.length === 0) return;
    isInitialized.current = true;

    const urlAccountId = searchParams.get("account");

    // Validate URL account exists in user's accounts
    if (urlAccountId && accounts.some((a) => a.id === urlAccountId)) {
      setSelectedAccountId(urlAccountId);
      lastAccountRef.current = urlAccountId;
    } else if (accounts.length > 0) {
      // No valid account in URL, select first account
      const firstAccountId = accounts[0].id;
      setSelectedAccountId(firstAccountId);
      lastAccountRef.current = firstAccountId;

      // Update URL with account param
      const params = new URLSearchParams(searchParams.toString());
      params.set("account", firstAccountId);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [accounts, searchParams, setSelectedAccountId, pathname, router]);

  // Build URL with account param
  const buildUrl = useCallback(
    (accountId: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("account", accountId);
      return `${pathname}?${params.toString()}`;
    },
    [pathname, searchParams]
  );

  // Subscribe to store changes and update URL
  useEffect(() => {
    if (!isInitialized.current) return;

    const unsubscribe = useAccountStore.subscribe((state) => {
      const newAccountId = state.selectedAccountId;

      // Only update URL if account actually changed
      if (newAccountId && newAccountId !== lastAccountRef.current) {
        lastAccountRef.current = newAccountId;
        router.replace(buildUrl(newAccountId), { scroll: false });
      }
    });

    return unsubscribe;
  }, [router, buildUrl]);

  return selectedAccountId;
}
