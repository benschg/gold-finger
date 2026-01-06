"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import {
  Wallet,
  TrendingDown,
  TrendingUp,
  CreditCard,
  Loader2,
} from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconBadge } from "@/components/ui/icon-picker";
import { StatCard } from "./stat-card";
import { ExpensePieChart } from "./expense-pie-chart";
import { StackedBarChart } from "./stacked-bar-chart";
import { TagDistributionChart } from "./tag-distribution-chart";
import { DateRangePicker } from "./date-range-picker";
import { ActiveFilters } from "./active-filters";
import { useAccounts } from "@/lib/hooks/use-accounts";
import { useDashboardUrlSync } from "@/hooks/use-dashboard-url-sync";
import { useDashboardFilterStore } from "@/store/dashboard-filter-store";
import {
  filterExpenses,
  transformToStackedBarData,
  calculateCategoryBreakdown,
  calculateTagDistribution,
  buildCategoryColorMap,
  buildCategoryIdMap,
} from "@/lib/dashboard-utils";
import type { Tables } from "@/types/database.types";

type Category = Tables<"categories">;
type Tag = Tables<"tags">;
type ExpenseWithDetails = Tables<"expenses"> & {
  category?: Category | null;
  tags?: Tag[];
};

interface DashboardContentProps {
  displayName: string;
}

export function DashboardContent({ displayName }: DashboardContentProps) {
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    null
  );
  const [expenses, setExpenses] = useState<ExpenseWithDetails[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { accounts, isLoading: isLoadingAccounts } = useAccounts();

  // Sync filter state with URL
  useDashboardUrlSync();

  // Get filter state from store
  const { dateRange, selectedCategoryId, selectedTagId } =
    useDashboardFilterStore();

  // Set default account when accounts load
  useEffect(() => {
    if (accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  // Fetch categories for the selected account
  const fetchCategories = useCallback(async () => {
    if (!selectedAccountId) return;

    try {
      const response = await fetch(
        `/api/categories?account_id=${selectedAccountId}`
      );
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  }, [selectedAccountId]);

  // Fetch tags for the selected account
  const fetchTags = useCallback(async () => {
    if (!selectedAccountId) return;

    try {
      const response = await fetch(`/api/tags?account_id=${selectedAccountId}`);
      if (response.ok) {
        const data = await response.json();
        setTags(data);
      }
    } catch (error) {
      console.error("Error fetching tags:", error);
    }
  }, [selectedAccountId]);

  // Fetch expenses
  const fetchExpenses = useCallback(async () => {
    if (!selectedAccountId) return;

    setIsLoading(true);
    try {
      // Fetch last 24 months of expenses to have data for all presets
      const startDate = format(subMonths(new Date(), 24), "yyyy-MM-dd");
      const response = await fetch(
        `/api/expenses?account_id=${selectedAccountId}&start_date=${startDate}&limit=2000`
      );
      if (response.ok) {
        const data = await response.json();
        setExpenses(data);
      }
    } catch (error) {
      console.error("Error fetching expenses:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedAccountId]);

  useEffect(() => {
    fetchExpenses();
    fetchCategories();
    fetchTags();
  }, [fetchExpenses, fetchCategories, fetchTags]);

  // Filter expenses based on current filters
  const filteredExpenses = useMemo(() => {
    return filterExpenses(expenses, {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      categoryId: selectedCategoryId,
      tagId: selectedTagId,
    });
  }, [expenses, dateRange, selectedCategoryId, selectedTagId]);

  // Calculate stats from filtered expenses
  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const thisMonthEnd = endOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));

  const thisMonthExpenses = useMemo(() => {
    return filteredExpenses.filter((e) => {
      const date = new Date(e.date);
      return date >= thisMonthStart && date <= thisMonthEnd;
    });
  }, [filteredExpenses, thisMonthStart, thisMonthEnd]);

  const lastMonthExpenses = useMemo(() => {
    return filteredExpenses.filter((e) => {
      const date = new Date(e.date);
      return date >= lastMonthStart && date <= lastMonthEnd;
    });
  }, [filteredExpenses, lastMonthStart, lastMonthEnd]);

  const thisMonthTotal = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const lastMonthTotal = lastMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Build category maps for charts
  const categoryColorMap = useMemo(
    () => buildCategoryColorMap(categories),
    [categories]
  );
  const categoryIdMap = useMemo(
    () => buildCategoryIdMap(categories),
    [categories]
  );

  // Calculate stacked bar chart data
  const { data: stackedBarData, categoryKeys } = useMemo(() => {
    return transformToStackedBarData(filteredExpenses, categories, 6);
  }, [filteredExpenses, categories]);

  // Calculate category breakdown for pie chart
  const categoryData = useMemo(() => {
    return calculateCategoryBreakdown(filteredExpenses);
  }, [filteredExpenses]);

  // Calculate tag distribution
  const tagData = useMemo(() => {
    return calculateTagDistribution(filteredExpenses);
  }, [filteredExpenses]);

  // Recent expenses
  const recentExpenses = filteredExpenses.slice(0, 5);

  // Dynamic title based on date range
  const dateRangeTitle = useMemo(() => {
    if (dateRange.preset === "ALL") return "All Time";
    if (dateRange.preset === "custom") {
      return `${format(dateRange.startDate, "MMM d")} - ${format(dateRange.endDate, "MMM d, yyyy")}`;
    }
    return `Last ${dateRange.preset}`;
  }, [dateRange]);

  if (isLoadingAccounts) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Account Selector and Date Range Picker */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">
              Welcome back, {displayName}!
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Here&apos;s an overview of your expenses
            </p>
          </div>

          {accounts.length > 0 && (
            <Select
              value={selectedAccountId || ""}
              onValueChange={setSelectedAccountId}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    <div className="flex items-center gap-2">
                      <IconBadge
                        icon={account.icon ?? "wallet"}
                        color={account.color ?? "#6366f1"}
                        size="xs"
                      />
                      {account.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Date Range Picker */}
        <DateRangePicker />

        {/* Active Filters */}
        <ActiveFilters categories={categories} tags={tags} />
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <StatCard
              title="Total Expenses"
              value={`€${totalExpenses.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}`}
              description={dateRangeTitle}
              icon={Wallet}
            />
            <StatCard
              title="This Month"
              value={`€${thisMonthTotal.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}`}
              description="Total expenses"
              icon={TrendingDown}
            />
            <StatCard
              title="Last Month"
              value={`€${lastMonthTotal.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}`}
              description="Total expenses"
              icon={TrendingUp}
            />
            <StatCard
              title="Transactions"
              value={filteredExpenses.length.toString()}
              description={dateRangeTitle}
              icon={CreditCard}
            />
          </div>

          {/* Charts - Stacked Bar and Pie */}
          <div className="grid gap-4 lg:grid-cols-2">
            <StackedBarChart
              data={stackedBarData}
              categoryKeys={categoryKeys}
              categoryColorMap={categoryColorMap}
              categoryIdMap={categoryIdMap}
              title="Monthly Expenses by Category"
            />
            <ExpensePieChart
              data={categoryData}
              title={`Category Breakdown (${dateRangeTitle})`}
            />
          </div>

          {/* Tag Distribution Chart */}
          {tagData.length > 0 && (
            <TagDistributionChart
              data={tagData}
              title={`Expenses by Tag (${dateRangeTitle})`}
            />
          )}

          {/* Recent Expenses */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              {recentExpenses.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No expenses match the current filters
                </div>
              ) : (
                <div className="space-y-3">
                  {recentExpenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="flex items-start sm:items-center justify-between gap-2 border-b pb-3 last:border-0"
                    >
                      <div className="flex items-start sm:items-center gap-2 sm:gap-3 min-w-0">
                        {expense.category && (
                          <IconBadge
                            icon={expense.category.icon}
                            color={expense.category.color}
                            size="md"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-sm sm:text-base truncate">
                            {expense.description || "No description"}
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {expense.category?.name || "Uncategorized"} •{" "}
                            {format(new Date(expense.date), "MMM d")}
                          </p>
                        </div>
                      </div>
                      <span className="font-medium text-sm sm:text-base whitespace-nowrap">
                        €
                        {expense.amount.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
