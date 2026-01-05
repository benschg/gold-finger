"use client";

import { useState, useEffect, useCallback } from "react";
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
import { StatCard } from "./stat-card";
import { ExpensePieChart } from "./expense-pie-chart";
import { ExpenseBarChart } from "./expense-bar-chart";
import { useAccounts } from "@/lib/hooks/use-accounts";
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
  const [isLoading, setIsLoading] = useState(false);

  const { accounts, isLoading: isLoadingAccounts } = useAccounts();

  // Set default account when accounts load
  useEffect(() => {
    if (accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  // Fetch expenses
  const fetchExpenses = useCallback(async () => {
    if (!selectedAccountId) return;

    setIsLoading(true);
    try {
      // Fetch last 12 months of expenses
      const startDate = format(subMonths(new Date(), 12), "yyyy-MM-dd");
      const response = await fetch(
        `/api/expenses?account_id=${selectedAccountId}&start_date=${startDate}&limit=1000`
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
  }, [fetchExpenses]);

  // Calculate stats
  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const thisMonthEnd = endOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));

  const thisMonthExpenses = expenses.filter((e) => {
    const date = new Date(e.date);
    return date >= thisMonthStart && date <= thisMonthEnd;
  });

  const lastMonthExpenses = expenses.filter((e) => {
    const date = new Date(e.date);
    return date >= lastMonthStart && date <= lastMonthEnd;
  });

  const thisMonthTotal = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const lastMonthTotal = lastMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Calculate category breakdown for pie chart
  const categoryMap = new Map<string, { name: string; value: number; color: string }>();
  thisMonthExpenses.forEach((expense) => {
    const categoryName = expense.category?.name || "Uncategorized";
    const categoryColor = expense.category?.color || "#94a3b8";
    const existing = categoryMap.get(categoryName);
    if (existing) {
      existing.value += expense.amount;
    } else {
      categoryMap.set(categoryName, {
        name: categoryName,
        value: expense.amount,
        color: categoryColor,
      });
    }
  });
  const categoryData = Array.from(categoryMap.values());

  // Calculate monthly data for bar chart
  const monthlyMap = new Map<string, number>();
  for (let i = 5; i >= 0; i--) {
    const month = subMonths(now, i);
    const monthKey = format(month, "MMM");
    monthlyMap.set(monthKey, 0);
  }
  expenses.forEach((expense) => {
    const month = format(new Date(expense.date), "MMM");
    if (monthlyMap.has(month)) {
      monthlyMap.set(month, (monthlyMap.get(month) || 0) + expense.amount);
    }
  });
  const monthlyData = Array.from(monthlyMap.entries()).map(([month, amount]) => ({
    month,
    amount,
  }));

  // Recent expenses
  const recentExpenses = expenses.slice(0, 5);

  if (isLoadingAccounts) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {displayName}!</h1>
          <p className="text-muted-foreground">
            Here&apos;s an overview of your expenses
          </p>
        </div>

        {accounts.length > 0 && (
          <Select
            value={selectedAccountId || ""}
            onValueChange={setSelectedAccountId}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select account" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Expenses"
              value={`€${totalExpenses.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}`}
              description="All time"
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
              value={thisMonthExpenses.length.toString()}
              description="This month"
              icon={CreditCard}
            />
          </div>

          {/* Charts */}
          <div className="grid gap-4 md:grid-cols-2">
            <ExpenseBarChart data={monthlyData} title="Monthly Expenses" />
            <ExpensePieChart data={categoryData} title="This Month by Category" />
          </div>

          {/* Recent Expenses */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              {recentExpenses.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No expenses yet. Add your first expense!
                </div>
              ) : (
                <div className="space-y-3">
                  {recentExpenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between border-b pb-3 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        {expense.category && (
                          <div
                            className="h-8 w-8 rounded-full"
                            style={{ backgroundColor: expense.category.color }}
                          />
                        )}
                        <div>
                          <p className="font-medium">
                            {expense.description || "No description"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {expense.category?.name || "Uncategorized"} •{" "}
                            {format(new Date(expense.date), "MMM d, yyyy")}
                          </p>
                        </div>
                      </div>
                      <span className="font-medium">
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
