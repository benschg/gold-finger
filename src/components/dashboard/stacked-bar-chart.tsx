"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { tooltipStyles, axisStyles, formatCurrency } from "./chart-styles";
import { useDashboardFilterStore } from "@/store/dashboard-filter-store";
import type { StackedMonthData } from "@/lib/dashboard-utils";

interface StackedBarChartProps {
  data: StackedMonthData[];
  categoryKeys: string[];
  categoryColorMap: Map<string, string>;
  categoryIdMap: Map<string, string>;
  title?: string;
}

interface TooltipEntry {
  value?: number;
  dataKey?: string;
  color?: string;
}

// Custom tooltip showing category breakdown
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const total = payload.reduce(
    (sum: number, entry: TooltipEntry) => sum + (entry.value || 0),
    0,
  );

  return (
    <div
      className="rounded-lg border bg-card p-3 shadow-md"
      style={tooltipStyles.contentStyle}
    >
      <p className="font-medium mb-2">{label}</p>
      <div className="space-y-1">
        {payload
          .filter((entry: TooltipEntry) => (entry.value || 0) > 0)
          .sort(
            (a: TooltipEntry, b: TooltipEntry) =>
              (b.value || 0) - (a.value || 0),
          )
          .map((entry: TooltipEntry) => (
            <div
              key={entry.dataKey}
              className="flex items-center justify-between gap-4 text-sm"
            >
              <div className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-sm"
                  style={{ backgroundColor: entry.color }}
                />
                <span>{entry.dataKey}</span>
              </div>
              <span className="font-medium">{formatCurrency(entry.value)}</span>
            </div>
          ))}
      </div>
      <div className="mt-2 pt-2 border-t flex justify-between text-sm font-medium">
        <span>Total</span>
        <span>{formatCurrency(total)}</span>
      </div>
    </div>
  );
}

export function StackedBarChart({
  data,
  categoryKeys,
  categoryColorMap,
  categoryIdMap,
  title = "Monthly Expenses by Category",
}: StackedBarChartProps) {
  const {
    hoveredCategoryId,
    selectedCategoryId,
    setHoveredCategoryId,
    setSelectedCategoryId,
  } = useDashboardFilterStore();

  const handleBarClick = (categoryName: string) => {
    const categoryId = categoryIdMap.get(categoryName) || null;
    // Toggle behavior: if clicking same category, clear filter
    if (selectedCategoryId === categoryId) {
      setSelectedCategoryId(null);
    } else {
      setSelectedCategoryId(categoryId);
    }
  };

  const handleBarMouseEnter = (categoryName: string) => {
    const categoryId = categoryIdMap.get(categoryName) || null;
    setHoveredCategoryId(categoryId);
  };

  const handleBarMouseLeave = () => {
    setHoveredCategoryId(null);
  };

  const getBarOpacity = (categoryName: string): number => {
    const categoryId = categoryIdMap.get(categoryName) || null;

    // If a category is selected, highlight only that category
    if (selectedCategoryId) {
      return selectedCategoryId === categoryId ? 1 : 0.3;
    }

    // If hovering, highlight hovered category
    if (hoveredCategoryId) {
      return hoveredCategoryId === categoryId ? 1 : 0.4;
    }

    return 1;
  };

  if (data.length === 0 || categoryKeys.length === 0) {
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
              <XAxis dataKey="monthLabel" {...axisStyles} />
              <YAxis {...axisStyles} tickFormatter={(value) => `€${value}`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: "10px" }}
                formatter={(value) => (
                  <span className="text-xs text-muted-foreground">{value}</span>
                )}
              />
              {categoryKeys.map((categoryName) => (
                <Bar
                  key={categoryName}
                  dataKey={categoryName}
                  stackId="expenses"
                  fill={categoryColorMap.get(categoryName) || "#6366f1"}
                  radius={[0, 0, 0, 0]}
                  cursor="pointer"
                  opacity={getBarOpacity(categoryName)}
                  onClick={() => handleBarClick(categoryName)}
                  onMouseEnter={() => handleBarMouseEnter(categoryName)}
                  onMouseLeave={handleBarMouseLeave}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
