import type { CSSProperties } from "react";

export const tooltipStyles = {
  contentStyle: {
    backgroundColor: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
  } as CSSProperties,
  labelStyle: { color: "var(--foreground)" } as CSSProperties,
  itemStyle: { color: "var(--foreground)" } as CSSProperties,
};

export const axisStyles = {
  fontSize: 12,
  tickLine: false,
  axisLine: false,
  tick: { fill: "var(--foreground)" },
};

export function formatCurrency(value: unknown): string {
  if (typeof value === "number") {
    return `€${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  }
  return String(value);
}
