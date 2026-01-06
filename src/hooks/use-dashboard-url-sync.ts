"use client";

import { useEffect, useRef, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { format, parseISO } from "date-fns";
import {
  useDashboardFilterStore,
  calculateDateRangeFromPreset,
  type DatePreset,
} from "@/store/dashboard-filter-store";

const DATE_PRESETS: DatePreset[] = ["7D", "30D", "90D", "YTD", "1Y", "ALL"];

/**
 * Hook to sync dashboard filter state with URL query parameters
 */
export function useDashboardUrlSync() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const isInitialized = useRef(false);
  const lastUrlRef = useRef<string>("");

  // Hydrate store from URL on mount (only once)
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const preset = searchParams.get("preset") as DatePreset | null;
    const category = searchParams.get("category");
    const tag = searchParams.get("tag");

    const store = useDashboardFilterStore.getState();

    // Hydrate date range
    if (preset && DATE_PRESETS.includes(preset)) {
      const { startDate, endDate } = calculateDateRangeFromPreset(preset);
      store.setDateRange({ startDate, endDate, preset });
    } else if (from && to) {
      try {
        const startDate = parseISO(from);
        const endDate = parseISO(to);
        if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
          store.setDateRange({ startDate, endDate, preset: "custom" });
        }
      } catch {
        // Invalid dates, use defaults
      }
    }

    // Hydrate category filter
    if (category) {
      store.setSelectedCategoryId(category);
    }

    // Hydrate tag filter
    if (tag) {
      store.setSelectedTagId(tag);
    }

    // Store initial URL to prevent immediate re-update
    lastUrlRef.current = window.location.search;
  }, []); // Empty deps - only run once on mount

  // Build URL from current state
  const buildUrl = useCallback(() => {
    const state = useDashboardFilterStore.getState();
    const params = new URLSearchParams();

    // Preserve account param if present
    const account = searchParams.get("account");
    if (account) {
      params.set("account", account);
    }

    // Add date range params
    if (state.dateRange.preset !== "ALL") {
      if (state.dateRange.preset !== "custom") {
        params.set("preset", state.dateRange.preset);
      } else {
        params.set("from", format(state.dateRange.startDate, "yyyy-MM-dd"));
        params.set("to", format(state.dateRange.endDate, "yyyy-MM-dd"));
      }
    }

    // Add filter params
    if (state.selectedCategoryId) {
      params.set("category", state.selectedCategoryId);
    }

    if (state.selectedTagId) {
      params.set("tag", state.selectedTagId);
    }

    return params.toString() ? `?${params.toString()}` : "";
  }, [searchParams]);

  // Subscribe to store changes and update URL
  useEffect(() => {
    if (!isInitialized.current) return;

    const unsubscribe = useDashboardFilterStore.subscribe(() => {
      const newSearch = buildUrl();

      // Only update if URL actually changed
      if (newSearch !== lastUrlRef.current) {
        lastUrlRef.current = newSearch;
        const newUrl = newSearch ? `${pathname}${newSearch}` : pathname;
        router.replace(newUrl, { scroll: false });
      }
    });

    return unsubscribe;
  }, [pathname, router, buildUrl]);
}
