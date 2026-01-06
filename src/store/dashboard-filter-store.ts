import { create } from "zustand";
import { subDays, subYears, startOfYear } from "date-fns";

export type DatePreset = "7D" | "30D" | "90D" | "YTD" | "1Y" | "ALL";

export interface DateRange {
  startDate: Date;
  endDate: Date;
  preset: DatePreset | "custom";
}

interface DashboardFilterState {
  // Date range
  dateRange: DateRange;

  // Cross-filter selections
  selectedCategoryId: string | null;
  selectedTagId: string | null;

  // Hover highlight state
  hoveredCategoryId: string | null;
  hoveredTagId: string | null;

  // Actions
  setDateRange: (range: DateRange) => void;
  setDatePreset: (preset: DatePreset) => void;
  setSelectedCategoryId: (id: string | null) => void;
  setSelectedTagId: (id: string | null) => void;
  setHoveredCategoryId: (id: string | null) => void;
  setHoveredTagId: (id: string | null) => void;
  clearFilters: () => void;
  clearDateRange: () => void;

  // Computed helpers
  isFiltered: () => boolean;
}

export function calculateDateRangeFromPreset(preset: DatePreset): {
  startDate: Date;
  endDate: Date;
} {
  const endDate = new Date();
  let startDate: Date;

  switch (preset) {
    case "7D":
      startDate = subDays(endDate, 7);
      break;
    case "30D":
      startDate = subDays(endDate, 30);
      break;
    case "90D":
      startDate = subDays(endDate, 90);
      break;
    case "YTD":
      startDate = startOfYear(endDate);
      break;
    case "1Y":
      startDate = subYears(endDate, 1);
      break;
    case "ALL":
    default:
      startDate = new Date(2000, 0, 1);
      break;
  }

  return { startDate, endDate };
}

const defaultDateRange: DateRange = {
  ...calculateDateRangeFromPreset("ALL"),
  preset: "ALL",
};

export const useDashboardFilterStore = create<DashboardFilterState>(
  (set, get) => ({
    // Initial state
    dateRange: defaultDateRange,
    selectedCategoryId: null,
    selectedTagId: null,
    hoveredCategoryId: null,
    hoveredTagId: null,

    // Actions
    setDateRange: (range) => set({ dateRange: range }),

    setDatePreset: (preset) => {
      const { startDate, endDate } = calculateDateRangeFromPreset(preset);
      set({
        dateRange: { startDate, endDate, preset },
      });
    },

    setSelectedCategoryId: (id) => set({ selectedCategoryId: id }),

    setSelectedTagId: (id) => set({ selectedTagId: id }),

    setHoveredCategoryId: (id) => set({ hoveredCategoryId: id }),

    setHoveredTagId: (id) => set({ hoveredTagId: id }),

    clearFilters: () =>
      set({
        selectedCategoryId: null,
        selectedTagId: null,
        dateRange: defaultDateRange,
      }),

    clearDateRange: () => set({ dateRange: defaultDateRange }),

    isFiltered: () => {
      const state = get();
      return (
        state.selectedCategoryId !== null ||
        state.selectedTagId !== null ||
        state.dateRange.preset !== "ALL"
      );
    },
  })
);
