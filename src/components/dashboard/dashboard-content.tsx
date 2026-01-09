"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { useTranslations } from "next-intl";
import {
  Wallet,
  TrendingDown,
  TrendingUp,
  CreditCard,
  Loader2,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconBadge } from "@/components/ui/icon-picker";
import { StatCard } from "./stat-card";
import { ExpensePieChart } from "./expense-pie-chart";
import { StackedBarChart } from "./stacked-bar-chart";
import { TagDistributionChart } from "./tag-distribution-chart";
import { IncomeExpenseComparisonChart } from "./income-expense-comparison-chart";
import { DateRangePicker } from "./date-range-picker";
import { ActiveFilters } from "./active-filters";
import { useAccounts } from "@/lib/hooks/use-accounts";
import { useDashboardUrlSync } from "@/hooks/use-dashboard-url-sync";
import { useDashboardFilterStore } from "@/store/dashboard-filter-store";
import { useAccountUrlSync } from "@/hooks/use-account-url-sync";
import { useAccountStore } from "@/store/account-store";
import {
  filterExpenses,
  filterIncomes,
  transformToStackedBarData,
  transformToComparisonChartData,
  calculateCategoryBreakdown,
  calculateTagDistribution,
  calculateNetFlow,
  buildCategoryColorMap,
  buildCategoryIdMap,
} from "@/lib/dashboard-utils";
import { formatCurrency, DEFAULT_CURRENCY } from "@/lib/constants";
import type {
  Category,
  Tag,
  ExpenseWithDetails,
  IncomeWithCategory,
} from "@/types/database";

interface DashboardContentProps {
  displayName: string;
}

export function DashboardContent({ displayName }: DashboardContentProps) {
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");
  const tDateRange = useTranslations("dateRange");
  const [expenses, setExpenses] = useState<ExpenseWithDetails[]>([]);
  const [incomes, setIncomes] = useState<IncomeWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { accounts, isLoading: isLoadingAccounts } = useAccounts();

  // Sync account selection with URL
  useAccountUrlSync(accounts);
  const { selectedAccountId } = useAccountStore();

  // Get the selected account's currency
  const accountCurrency = useMemo(() => {
    const selectedAccount = accounts.find((a) => a.id === selectedAccountId);
    return selectedAccount?.currency || DEFAULT_CURRENCY;
  }, [accounts, selectedAccountId]);

  // Sync filter state with URL
  useDashboardUrlSync();

  // Get filter state from store
  const { dateRange, selectedCategoryId, selectedTagId } =
    useDashboardFilterStore();

  // Fetch categories for the selected account
  const fetchCategories = useCallback(async () => {
    if (!selectedAccountId) return;

    try {
      const response = await fetch(
        `/api/categories?account_id=${selectedAccountId}`,
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
        `/api/expenses?account_id=${selectedAccountId}&start_date=${startDate}&limit=2000`,
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

  // Fetch incomes
  const fetchIncomes = useCallback(async () => {
    if (!selectedAccountId) return;

    try {
      // Fetch last 24 months of incomes to have data for all presets
      const startDate = format(subMonths(new Date(), 24), "yyyy-MM-dd");
      const response = await fetch(
        `/api/incomes?account_id=${selectedAccountId}&start_date=${startDate}&limit=2000`,
      );
      if (response.ok) {
        const data = await response.json();
        setIncomes(data);
      }
    } catch (error) {
      console.error("Error fetching incomes:", error);
    }
  }, [selectedAccountId]);

  useEffect(() => {
    fetchExpenses();
    fetchIncomes();
    fetchCategories();
    fetchTags();
  }, [fetchExpenses, fetchIncomes, fetchCategories, fetchTags]);

  // Filter expenses based on current filters
  const filteredExpenses = useMemo(() => {
    return filterExpenses(expenses, {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      categoryId: selectedCategoryId,
      tagId: selectedTagId,
    });
  }, [expenses, dateRange, selectedCategoryId, selectedTagId]);

  // Filter incomes based on current filters (no tags for income)
  const filteredIncomes = useMemo(() => {
    return filterIncomes(incomes, {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    });
  }, [incomes, dateRange]);

  // Calculate stats from filtered expenses
  // Memoize date boundaries to prevent unnecessary recalculations
  const { thisMonthStart, thisMonthEnd, lastMonthStart, lastMonthEnd } =
    useMemo(() => {
      const now = new Date();
      return {
        thisMonthStart: startOfMonth(now),
        thisMonthEnd: endOfMonth(now),
        lastMonthStart: startOfMonth(subMonths(now, 1)),
        lastMonthEnd: endOfMonth(subMonths(now, 1)),
      };
    }, []);

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

  const thisMonthTotal = thisMonthExpenses.reduce(
    (sum, e) => sum + e.amount,
    0,
  );
  const lastMonthTotal = lastMonthExpenses.reduce(
    (sum, e) => sum + e.amount,
    0,
  );
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Income stats calculations
  const thisMonthIncomes = useMemo(() => {
    return filteredIncomes.filter((i) => {
      const date = new Date(i.date);
      return date >= thisMonthStart && date <= thisMonthEnd;
    });
  }, [filteredIncomes, thisMonthStart, thisMonthEnd]);

  const lastMonthIncomes = useMemo(() => {
    return filteredIncomes.filter((i) => {
      const date = new Date(i.date);
      return date >= lastMonthStart && date <= lastMonthEnd;
    });
  }, [filteredIncomes, lastMonthStart, lastMonthEnd]);

  const thisMonthIncomeTotal = thisMonthIncomes.reduce(
    (sum, i) => sum + i.amount,
    0,
  );
  const lastMonthIncomeTotal = lastMonthIncomes.reduce(
    (sum, i) => sum + i.amount,
    0,
  );
  const totalIncome = filteredIncomes.reduce((sum, i) => sum + i.amount, 0);

  // Net flow calculation
  const { netFlow } = calculateNetFlow(filteredExpenses, filteredIncomes);

  // Build category maps for charts
  const categoryColorMap = useMemo(
    () => buildCategoryColorMap(categories),
    [categories],
  );
  const categoryIdMap = useMemo(
    () => buildCategoryIdMap(categories),
    [categories],
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

  // Calculate income vs expenses comparison chart data
  const comparisonChartData = useMemo(() => {
    return transformToComparisonChartData(filteredExpenses, filteredIncomes, 6);
  }, [filteredExpenses, filteredIncomes]);

  // Recent expenses
  const recentExpenses = filteredExpenses.slice(0, 5);

  // Dynamic title based on date range
  const dateRangeTitle = useMemo(() => {
    if (dateRange.preset === "ALL") return tDateRange("allTime");
    if (dateRange.preset === "custom") {
      return `${format(dateRange.startDate, "MMM d")} - ${format(dateRange.endDate, "MMM d, yyyy")}`;
    }
    return t("last", { period: dateRange.preset });
  }, [dateRange, t, tDateRange]);

  if (isLoadingAccounts) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Date Range Picker */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">
            {t("welcomeBack", { name: displayName })}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {t("overview")}
          </p>
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
          {/* Stats Cards - Expenses Row */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <StatCard
              title={t("totalExpenses")}
              value={formatCurrency(totalExpenses, accountCurrency)}
              description={dateRangeTitle}
              icon={Wallet}
              valueClassName="text-red-600 dark:text-red-400"
            />
            <StatCard
              title={t("totalIncome")}
              value={formatCurrency(totalIncome, accountCurrency)}
              description={dateRangeTitle}
              icon={TrendingUp}
              valueClassName="text-green-600 dark:text-green-400"
            />
            <StatCard
              title={t("netFlow")}
              value={formatCurrency(netFlow, accountCurrency, {
                showPlusSign: true,
              })}
              description={dateRangeTitle}
              icon={netFlow >= 0 ? TrendingUp : TrendingDown}
              valueClassName={
                netFlow >= 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }
            />
            <StatCard
              title={t("transactions")}
              value={(
                filteredExpenses.length + filteredIncomes.length
              ).toString()}
              description={dateRangeTitle}
              icon={CreditCard}
            />
          </div>

          {/* Stats Cards - Monthly Row */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <StatCard
              title={t("thisMonthExpenses")}
              value={formatCurrency(thisMonthTotal, accountCurrency)}
              description={t("expenses")}
              icon={TrendingDown}
            />
            <StatCard
              title={t("thisMonthIncome")}
              value={formatCurrency(thisMonthIncomeTotal, accountCurrency)}
              description={t("income")}
              icon={TrendingUp}
            />
            <StatCard
              title={t("lastMonthExpenses")}
              value={formatCurrency(lastMonthTotal, accountCurrency)}
              description={t("expenses")}
              icon={TrendingDown}
            />
            <StatCard
              title={t("lastMonthIncome")}
              value={formatCurrency(lastMonthIncomeTotal, accountCurrency)}
              description={t("income")}
              icon={TrendingUp}
            />
          </div>

          {/* Charts - Stacked Bar and Pie */}
          <div className="grid gap-4 lg:grid-cols-2">
            <StackedBarChart
              data={stackedBarData}
              categoryKeys={categoryKeys}
              categoryColorMap={categoryColorMap}
              categoryIdMap={categoryIdMap}
              title={t("monthlyExpensesByCategory")}
            />
            <ExpensePieChart
              data={categoryData}
              title={`${t("categoryBreakdown")} (${dateRangeTitle})`}
            />
          </div>

          {/* Income vs Expenses Comparison Chart */}
          <IncomeExpenseComparisonChart
            data={comparisonChartData}
            title={t("incomeVsExpenses")}
          />

          {/* Tag Distribution Chart */}
          {tagData.length > 0 && (
            <TagDistributionChart
              data={tagData}
              title={`${t("expensesByTag")} (${dateRangeTitle})`}
            />
          )}

          {/* Recent Expenses */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("recentExpenses")}</CardTitle>
            </CardHeader>
            <CardContent>
              {recentExpenses.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  {t("noExpensesMatch")}
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
                            {expense.description || tCommon("noDescription")}
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {expense.category?.name || t("uncategorized")} •{" "}
                            {format(new Date(expense.date), "MMM d")}
                          </p>
                        </div>
                      </div>
                      <span className="font-medium text-sm sm:text-base whitespace-nowrap">
                        {formatCurrency(expense.amount, expense.currency)}
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
