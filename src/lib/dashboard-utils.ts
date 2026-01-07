import { format, parseISO, subMonths, isWithinInterval } from "date-fns";
import { UNCATEGORIZED_LABEL, UNCATEGORIZED_COLOR } from "@/lib/constants";
import type { Category, Tag, ExpenseWithDetails } from "@/types/database";

export interface StackedMonthData {
  month: string;
  monthLabel: string;
  total: number;
  [categoryName: string]: number | string;
}

export interface CategoryBreakdown {
  categoryId: string | null;
  name: string;
  color: string;
  value: number;
  percentage: number;
  [key: string]: string | number | null;
}

export interface TagBreakdown {
  tagId: string;
  name: string;
  color: string;
  count: number;
  totalAmount: number;
  percentage: number;
}

export interface FilterOptions {
  startDate?: Date;
  endDate?: Date;
  categoryId?: string | null;
  tagId?: string | null;
}

/**
 * Filter expenses based on date range, category, and tag
 */
export function filterExpenses(
  expenses: ExpenseWithDetails[],
  filters: FilterOptions,
): ExpenseWithDetails[] {
  return expenses.filter((expense) => {
    const expenseDate = new Date(expense.date);

    // Date range filter
    if (filters.startDate && filters.endDate) {
      if (
        !isWithinInterval(expenseDate, {
          start: filters.startDate,
          end: filters.endDate,
        })
      ) {
        return false;
      }
    }

    // Category filter
    if (filters.categoryId && expense.category_id !== filters.categoryId) {
      return false;
    }

    // Tag filter
    if (filters.tagId && !expense.tags?.some((t) => t.id === filters.tagId)) {
      return false;
    }

    return true;
  });
}

/**
 * Transform expenses to stacked bar chart data format
 */
export function transformToStackedBarData(
  expenses: ExpenseWithDetails[],
  categories: Category[],
  monthCount: number = 6,
): { data: StackedMonthData[]; categoryKeys: string[] } {
  const now = new Date();
  const monthMap = new Map<string, Map<string, number>>();
  const categoryColorMap = new Map<string, string>();

  // Build category color map
  categories.forEach((cat) => {
    categoryColorMap.set(cat.name, cat.color);
  });
  categoryColorMap.set(UNCATEGORIZED_LABEL, UNCATEGORIZED_COLOR);

  // Initialize months
  for (let i = monthCount - 1; i >= 0; i--) {
    const month = subMonths(now, i);
    const monthKey = format(month, "yyyy-MM");
    monthMap.set(monthKey, new Map());
  }

  // Aggregate expenses by month and category
  expenses.forEach((expense) => {
    const monthKey = format(new Date(expense.date), "yyyy-MM");
    const categoryName = expense.category?.name || UNCATEGORIZED_LABEL;

    if (monthMap.has(monthKey)) {
      const categoryMap = monthMap.get(monthKey)!;
      const currentAmount = categoryMap.get(categoryName) || 0;
      categoryMap.set(categoryName, currentAmount + expense.amount);
    }
  });

  // Collect all unique categories that have data
  const categoryKeys = new Set<string>();
  monthMap.forEach((categoryMap) => {
    categoryMap.forEach((_, categoryName) => {
      categoryKeys.add(categoryName);
    });
  });

  // Convert to array format for Recharts
  const data: StackedMonthData[] = [];

  monthMap.forEach((categoryMap, monthKey) => {
    const monthData: StackedMonthData = {
      month: monthKey,
      monthLabel: format(parseISO(`${monthKey}-01`), "MMM"),
      total: 0,
    };

    categoryMap.forEach((amount, categoryName) => {
      monthData[categoryName] = amount;
      monthData.total += amount;
    });

    data.push(monthData);
  });

  return {
    data,
    categoryKeys: Array.from(categoryKeys).sort((a, b) => {
      // Put uncategorized last
      if (a === UNCATEGORIZED_LABEL) return 1;
      if (b === UNCATEGORIZED_LABEL) return -1;
      return a.localeCompare(b);
    }),
  };
}

/**
 * Calculate category breakdown for pie chart
 */
export function calculateCategoryBreakdown(
  expenses: ExpenseWithDetails[],
): CategoryBreakdown[] {
  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
  const categoryMap = new Map<
    string,
    { categoryId: string | null; name: string; color: string; value: number }
  >();

  expenses.forEach((expense) => {
    const categoryId = expense.category_id;
    const categoryName = expense.category?.name || UNCATEGORIZED_LABEL;
    const categoryColor = expense.category?.color || UNCATEGORIZED_COLOR;

    const existing = categoryMap.get(categoryName);
    if (existing) {
      existing.value += expense.amount;
    } else {
      categoryMap.set(categoryName, {
        categoryId,
        name: categoryName,
        color: categoryColor,
        value: expense.amount,
      });
    }
  });

  return Array.from(categoryMap.values())
    .map((cat) => ({
      ...cat,
      percentage: totalAmount > 0 ? (cat.value / totalAmount) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value);
}

/**
 * Calculate tag distribution for tag chart
 */
export function calculateTagDistribution(
  expenses: ExpenseWithDetails[],
): TagBreakdown[] {
  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
  const tagMap = new Map<
    string,
    { tag: Tag; count: number; totalAmount: number }
  >();

  expenses.forEach((expense) => {
    expense.tags?.forEach((tag) => {
      const existing = tagMap.get(tag.id);
      if (existing) {
        existing.count++;
        existing.totalAmount += expense.amount;
      } else {
        tagMap.set(tag.id, { tag, count: 1, totalAmount: expense.amount });
      }
    });
  });

  return Array.from(tagMap.values())
    .map(({ tag, count, totalAmount: tagAmount }) => ({
      tagId: tag.id,
      name: tag.name,
      color: tag.color || "#6366f1",
      count,
      totalAmount: tagAmount,
      percentage: totalAmount > 0 ? (tagAmount / totalAmount) * 100 : 0,
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount);
}

/**
 * Build a map of category IDs to colors
 */
export function buildCategoryColorMap(
  categories: Category[],
): Map<string, string> {
  const map = new Map<string, string>();
  categories.forEach((cat) => {
    map.set(cat.id, cat.color);
    map.set(cat.name, cat.color);
  });
  map.set(UNCATEGORIZED_LABEL, UNCATEGORIZED_COLOR);
  return map;
}

/**
 * Build a map of category names to IDs
 */
export function buildCategoryIdMap(
  categories: Category[],
): Map<string, string> {
  const map = new Map<string, string>();
  categories.forEach((cat) => {
    map.set(cat.name, cat.id);
  });
  return map;
}

/**
 * Format currency value
 */
export function formatCurrency(
  value: number,
  currency: string = "EUR",
): string {
  return new Intl.NumberFormat("en-EU", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}
