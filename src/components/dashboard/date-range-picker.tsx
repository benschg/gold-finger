"use client";

import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import type { DateRange as DayPickerDateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  useDashboardFilterStore,
  type DatePreset,
} from "@/store/dashboard-filter-store";

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: "7D", label: "7D" },
  { value: "30D", label: "30D" },
  { value: "90D", label: "90D" },
  { value: "YTD", label: "YTD" },
  { value: "1Y", label: "1Y" },
  { value: "ALL", label: "All" },
];

interface DateRangePickerProps {
  className?: string;
}

export function DateRangePicker({ className }: DateRangePickerProps) {
  const { dateRange, setDateRange, setDatePreset } = useDashboardFilterStore();

  const handlePresetClick = (preset: DatePreset) => {
    setDatePreset(preset);
  };

  const handleDateRangeSelect = (range: DayPickerDateRange | undefined) => {
    if (range?.from && range?.to) {
      setDateRange({
        startDate: range.from,
        endDate: range.to,
        preset: "custom",
      });
    } else if (range?.from) {
      setDateRange({
        startDate: range.from,
        endDate: range.from,
        preset: "custom",
      });
    }
  };

  const isCustomRange = dateRange.preset === "custom";
  const displayText = isCustomRange
    ? `${format(dateRange.startDate, "MMM d")} - ${format(dateRange.endDate, "MMM d, yyyy")}`
    : null;

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {DATE_PRESETS.map((preset) => (
        <Button
          key={preset.value}
          variant={dateRange.preset === preset.value ? "default" : "outline"}
          size="sm"
          onClick={() => handlePresetClick(preset.value)}
          className="h-8 px-3 text-xs"
        >
          {preset.label}
        </Button>
      ))}

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={isCustomRange ? "default" : "outline"}
            size="sm"
            className={cn(
              "h-8 px-3 text-xs gap-1.5",
              isCustomRange && "min-w-[180px]"
            )}
          >
            <CalendarIcon className="h-3.5 w-3.5" />
            {displayText || "Custom"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="range"
            defaultMonth={dateRange.startDate}
            selected={{
              from: dateRange.startDate,
              to: dateRange.endDate,
            }}
            onSelect={handleDateRangeSelect}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
