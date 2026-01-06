"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { tooltipStyles, axisStyles, formatCurrency } from "./chart-styles";
import { useDashboardFilterStore } from "@/store/dashboard-filter-store";
import type { TagBreakdown } from "@/lib/dashboard-utils";

interface TagDistributionChartProps {
  data: TagBreakdown[];
  title?: string;
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: TagBreakdown }>;
}) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const item = payload[0].payload;

  return (
    <div
      className="rounded-lg border bg-card p-3 shadow-md"
      style={tooltipStyles.contentStyle}
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className="h-3 w-3 rounded-sm"
          style={{ backgroundColor: item.color }}
        />
        <span className="font-medium">{item.name}</span>
      </div>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Amount</span>
          <span className="font-medium">{formatCurrency(item.totalAmount)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Transactions</span>
          <span className="font-medium">{item.count}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Share</span>
          <span className="font-medium">{item.percentage.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
}

export function TagDistributionChart({
  data,
  title = "Expenses by Tag",
}: TagDistributionChartProps) {
  const {
    hoveredTagId,
    selectedTagId,
    setHoveredTagId,
    setSelectedTagId,
  } = useDashboardFilterStore();

  const handleBarClick = (tagId: string) => {
    // Toggle behavior
    if (selectedTagId === tagId) {
      setSelectedTagId(null);
    } else {
      setSelectedTagId(tagId);
    }
  };

  const handleBarMouseEnter = (tagId: string) => {
    setHoveredTagId(tagId);
  };

  const handleBarMouseLeave = () => {
    setHoveredTagId(null);
  };

  const getBarOpacity = (tagId: string): number => {
    if (selectedTagId) {
      return selectedTagId === tagId ? 1 : 0.3;
    }
    if (hoveredTagId) {
      return hoveredTagId === tagId ? 1 : 0.4;
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
          <div className="flex h-[200px] items-center justify-center text-muted-foreground">
            No tags to display
          </div>
        </CardContent>
      </Card>
    );
  }

  // Take top 8 tags for display
  const displayData = data.slice(0, 8);
  const chartHeight = Math.max(150, displayData.length * 35 + 20);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ height: chartHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={displayData}
              layout="vertical"
              margin={{ left: 0, right: 20 }}
            >
              <XAxis
                type="number"
                {...axisStyles}
                tickFormatter={(value) => `€${value}`}
              />
              <YAxis
                type="category"
                dataKey="name"
                {...axisStyles}
                width={100}
                tick={{ fontSize: 11, fill: "var(--foreground)" }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="totalAmount"
                radius={[0, 4, 4, 0]}
                cursor="pointer"
              >
                {displayData.map((entry) => (
                  <Cell
                    key={entry.tagId}
                    fill={entry.color}
                    opacity={getBarOpacity(entry.tagId)}
                    onClick={() => handleBarClick(entry.tagId)}
                    onMouseEnter={() => handleBarMouseEnter(entry.tagId)}
                    onMouseLeave={handleBarMouseLeave}
                    style={{ cursor: "pointer" }}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
