"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { tooltipStyles, axisStyles, formatCurrency } from "./chart-styles";

interface MonthlyData {
  month: string;
  amount: number;
}

interface ExpenseBarChartProps {
  data: MonthlyData[];
  title?: string;
}

export function ExpenseBarChart({
  data,
  title = "Monthly Expenses",
}: ExpenseBarChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[250px] sm:h-[300px] items-center justify-center text-muted-foreground">
            No data to display
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] sm:h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" {...axisStyles} />
              <YAxis {...axisStyles} tickFormatter={(value) => `€${value}`} />
              <Tooltip formatter={formatCurrency} {...tooltipStyles} />
              <Bar
                dataKey="amount"
                fill="var(--chart-1)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
