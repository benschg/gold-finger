"use client";

import { useTranslations } from "next-intl";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { tooltipStyles, axisStyles, formatCurrency } from "./chart-styles";
import type { ComparisonMonthData } from "@/lib/dashboard-utils";

interface IncomeExpenseComparisonChartProps {
  data: ComparisonMonthData[];
  title?: string;
}

interface TooltipEntry {
  value?: number;
  dataKey?: string;
  color?: string;
  name?: string;
}

// Custom tooltip showing income, expenses, and net flow
function CustomTooltip({
  active,
  payload,
  label,
  incomeLabel,
  expensesLabel,
  netFlowLabel,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
  incomeLabel: string;
  expensesLabel: string;
  netFlowLabel: string;
}) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const incomeEntry = payload.find((e) => e.dataKey === "income");
  const expensesEntry = payload.find((e) => e.dataKey === "expenses");
  const income = incomeEntry?.value || 0;
  const expenses = expensesEntry?.value || 0;
  const netFlow = income - expenses;

  return (
    <div
      className="rounded-lg border bg-card p-3 shadow-md"
      style={tooltipStyles.contentStyle}
    >
      <p className="font-medium mb-2">{label}</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-sm"
              style={{ backgroundColor: "#22c55e" }}
            />
            <span>{incomeLabel}</span>
          </div>
          <span className="font-medium text-green-600 dark:text-green-400">
            +{formatCurrency(income)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-sm"
              style={{ backgroundColor: "#ef4444" }}
            />
            <span>{expensesLabel}</span>
          </div>
          <span className="font-medium text-red-600 dark:text-red-400">
            -{formatCurrency(expenses)}
          </span>
        </div>
      </div>
      <div className="mt-2 pt-2 border-t flex justify-between text-sm font-medium">
        <span>{netFlowLabel}</span>
        <span
          className={
            netFlow >= 0
              ? "text-green-600 dark:text-green-400"
              : "text-red-600 dark:text-red-400"
          }
        >
          {netFlow >= 0 ? "+" : ""}
          {formatCurrency(netFlow)}
        </span>
      </div>
    </div>
  );
}

export function IncomeExpenseComparisonChart({
  data,
  title,
}: IncomeExpenseComparisonChartProps) {
  const t = useTranslations("dashboard");

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {title || t("incomeVsExpenses")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[250px] sm:h-[300px] items-center justify-center text-muted-foreground">
            {t("noDataToDisplay")}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {title || t("incomeVsExpenses")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] sm:h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="monthLabel" {...axisStyles} />
              <YAxis {...axisStyles} tickFormatter={(value) => `€${value}`} />
              <Tooltip
                content={
                  <CustomTooltip
                    incomeLabel={t("income")}
                    expensesLabel={t("expenses")}
                    netFlowLabel={t("netFlow")}
                  />
                }
              />
              <Legend
                wrapperStyle={{ paddingTop: "10px" }}
                formatter={(value) => (
                  <span className="text-xs text-muted-foreground">
                    {value === "income" ? t("income") : t("expenses")}
                  </span>
                )}
              />
              <ReferenceLine y={0} stroke="var(--border)" />
              <Bar
                dataKey="income"
                name="income"
                fill="#22c55e"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="expenses"
                name="expenses"
                fill="#ef4444"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
