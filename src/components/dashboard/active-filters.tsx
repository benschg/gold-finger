"use client";

import { X } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDashboardFilterStore } from "@/store/dashboard-filter-store";
import type { Tables } from "@/types/database.types";

type Category = Tables<"categories">;
type Tag = Tables<"tags">;

interface ActiveFiltersProps {
  categories: Category[];
  tags: Tag[];
}

export function ActiveFilters({ categories, tags }: ActiveFiltersProps) {
  const {
    dateRange,
    selectedCategoryId,
    selectedTagId,
    setSelectedCategoryId,
    setSelectedTagId,
    clearDateRange,
    clearFilters,
    isFiltered,
  } = useDashboardFilterStore();

  if (!isFiltered()) {
    return null;
  }

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
  const selectedTag = tags.find((t) => t.id === selectedTagId);
  const hasDateFilter = dateRange.preset !== "ALL";
  const hasMultipleFilters =
    [hasDateFilter, !!selectedCategory, !!selectedTag].filter(Boolean).length >
    1;

  const dateRangeText =
    dateRange.preset === "custom"
      ? `${format(dateRange.startDate, "MMM d")} - ${format(dateRange.endDate, "MMM d, yyyy")}`
      : dateRange.preset;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">Filters:</span>

      {hasDateFilter && (
        <Badge variant="secondary" className="gap-1 pr-1">
          {dateRangeText}
          <button
            onClick={clearDateRange}
            className="ml-1 rounded-full p-0.5 hover:bg-muted"
            aria-label="Clear date filter"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}

      {selectedCategory && (
        <Badge
          variant="secondary"
          className="gap-1 pr-1"
          style={{
            backgroundColor: `${selectedCategory.color}20`,
            borderColor: selectedCategory.color,
          }}
        >
          <div
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: selectedCategory.color }}
          />
          {selectedCategory.name}
          <button
            onClick={() => setSelectedCategoryId(null)}
            className="ml-1 rounded-full p-0.5 hover:bg-muted"
            aria-label="Clear category filter"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}

      {selectedTag && (
        <Badge
          variant="secondary"
          className="gap-1 pr-1"
          style={{
            backgroundColor: `${selectedTag.color || "#6366f1"}20`,
            borderColor: selectedTag.color || "#6366f1",
          }}
        >
          <div
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: selectedTag.color || "#6366f1" }}
          />
          {selectedTag.name}
          <button
            onClick={() => setSelectedTagId(null)}
            className="ml-1 rounded-full p-0.5 hover:bg-muted"
            aria-label="Clear tag filter"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}

      {hasMultipleFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="h-6 px-2 text-xs text-muted-foreground"
        >
          Clear all
        </Button>
      )}
    </div>
  );
}
