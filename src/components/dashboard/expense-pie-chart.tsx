"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { tooltipStyles, formatCurrency } from "./chart-styles";
import { useDashboardFilterStore } from "@/store/dashboard-filter-store";

interface CategoryData {
  categoryId: string | null;
  name: string;
  value: number;
  color: string;
  percentage: number;
  [key: string]: string | number | null;
}

interface ExpensePieChartProps {
  data: CategoryData[];
  title?: string;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: CategoryData }> }) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const item = payload[0].payload as CategoryData;

  return (
    <div
      className="rounded-lg border bg-card p-3 shadow-md"
      style={tooltipStyles.contentStyle}
    >
      <div className="flex items-center gap-2 mb-1">
        <div
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: item.color }}
        />
        <span className="font-medium">{item.name}</span>
      </div>
      <div className="text-sm space-y-0.5">
        <div>{formatCurrency(item.value)}</div>
        <div className="text-muted-foreground">{item.percentage.toFixed(1)}%</div>
      </div>
    </div>
  );
}

export function ExpensePieChart({
  data,
  title = "Expenses by Category",
}: ExpensePieChartProps) {
  const {
    hoveredCategoryId,
    selectedCategoryId,
    setHoveredCategoryId,
    setSelectedCategoryId,
  } = useDashboardFilterStore();

  const handlePieClick = (entry: CategoryData) => {
    // Toggle behavior: if clicking same category, clear filter
    if (selectedCategoryId === entry.categoryId) {
      setSelectedCategoryId(null);
    } else {
      setSelectedCategoryId(entry.categoryId);
    }
  };

  const handlePieMouseEnter = (entry: CategoryData) => {
    setHoveredCategoryId(entry.categoryId);
  };

  const handlePieMouseLeave = () => {
    setHoveredCategoryId(null);
  };

  const getCellOpacity = (categoryId: string | null): number => {
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
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
                cursor="pointer"
                onClick={(_, index) => handlePieClick(data[index])}
                onMouseEnter={(_, index) => handlePieMouseEnter(data[index])}
                onMouseLeave={handlePieMouseLeave}
              >
                {data.map((entry) => (
                  <Cell
                    key={entry.categoryId || "uncategorized"}
                    fill={entry.color}
                    opacity={getCellOpacity(entry.categoryId)}
                    stroke={
                      selectedCategoryId === entry.categoryId
                        ? "var(--foreground)"
                        : "transparent"
                    }
                    strokeWidth={selectedCategoryId === entry.categoryId ? 2 : 0}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(value) => (
                  <span className="text-xs text-muted-foreground">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
