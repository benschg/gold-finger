"use client";

import { useState, useEffect } from "react";
import {
  ArrowRightLeft,
  Loader2,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ExchangeRateHistoryProps {
  fromCurrency: string;
  toCurrency: string;
  trigger?: React.ReactNode;
}

interface RateData {
  date: string;
  rate: number;
}

interface HistoryData {
  from: string;
  to: string;
  rates: RateData[];
  stats: {
    min: number;
    max: number;
    avg: number;
    current: number;
    change: number;
  };
}

const periods = [
  { value: "1W", label: "1W" },
  { value: "1M", label: "1M" },
  { value: "1Y", label: "1Y" },
  { value: "5Y", label: "5Y" },
];

export function ExchangeRateHistory({
  fromCurrency,
  toCurrency,
  trigger,
}: ExchangeRateHistoryProps) {
  const t = useTranslations("exchangeRate");

  const [open, setOpen] = useState(false);
  const [period, setPeriod] = useState("1M");
  const [isSwapped, setIsSwapped] = useState(false);
  const [data, setData] = useState<HistoryData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use swapped currencies if toggled
  const displayFrom = isSwapped ? toCurrency : fromCurrency;
  const displayTo = isSwapped ? fromCurrency : toCurrency;

  // Only fetch when dialog is open
  useEffect(() => {
    if (!open) return;

    const fetchHistory = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/exchange-rates/history?from=${displayFrom}&to=${displayTo}&period=${period}`,
        );

        if (!response.ok) {
          throw new Error("Failed to fetch history");
        }

        const result = await response.json();
        setData(result);
      } catch {
        setError("Could not load exchange rate history");
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [open, period, displayFrom, displayTo]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (period === "1W" || period === "1M") {
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
    }
    return date.toLocaleDateString(undefined, {
      month: "short",
      year: "2-digit",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
            {t("history")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{displayFrom}</span>
            <button
              type="button"
              onClick={() => setIsSwapped(!isSwapped)}
              className="rounded-md p-1 hover:bg-muted transition-colors"
              title="Swap currencies"
            >
              <ArrowRightLeft className="h-4 w-4" />
            </button>
            <span>{displayTo}</span>
          </DialogTitle>
        </DialogHeader>

        {/* Period selector */}
        <div className="flex gap-1">
          {periods.map((p) => (
            <Button
              key={p.value}
              variant={period === p.value ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod(p.value)}
              className="flex-1"
            >
              {p.label}
            </Button>
          ))}
        </div>

        {/* Chart area */}
        <div className="h-64">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex h-full items-center justify-center text-destructive">
              {error}
            </div>
          ) : data ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.rates}>
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  domain={["auto", "auto"]}
                  tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => v.toFixed(3)}
                  width={50}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload?.[0]) {
                      const item = payload[0].payload as RateData;
                      return (
                        <div className="rounded-lg border bg-popover text-popover-foreground p-2 shadow-md">
                          <p className="text-xs text-muted-foreground">
                            {new Date(item.date).toLocaleDateString()}
                          </p>
                          <p className="font-medium">
                            1 {displayFrom} = {item.rate.toFixed(4)} {displayTo}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke="var(--chart-1)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : null}
        </div>

        {/* Stats */}
        {data && (
          <div className="grid grid-cols-4 gap-2 text-center text-sm">
            <div className="rounded-lg bg-muted p-2">
              <p className="text-xs text-muted-foreground">Current</p>
              <p className="font-medium">{data.stats.current.toFixed(4)}</p>
            </div>
            <div className="rounded-lg bg-muted p-2">
              <p className="text-xs text-muted-foreground">Average</p>
              <p className="font-medium">{data.stats.avg.toFixed(4)}</p>
            </div>
            <div className="rounded-lg bg-muted p-2">
              <p className="text-xs text-muted-foreground">Low</p>
              <p className="font-medium">{data.stats.min.toFixed(4)}</p>
            </div>
            <div className="rounded-lg bg-muted p-2">
              <p className="text-xs text-muted-foreground">High</p>
              <p className="font-medium">{data.stats.max.toFixed(4)}</p>
            </div>
          </div>
        )}

        {/* Change indicator */}
        {data && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Period change</span>
            <span
              className={`flex items-center gap-1 font-medium ${
                data.stats.change >= 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {data.stats.change >= 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              {data.stats.change >= 0 ? "+" : ""}
              {data.stats.change.toFixed(2)}%
            </span>
          </div>
        )}

        {/* Source attribution */}
        <div className="text-right text-xs text-muted-foreground">
          <a
            href="https://frankfurter.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            Data: ECB via Frankfurter
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
