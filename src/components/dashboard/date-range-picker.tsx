"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, ChevronDown } from "lucide-react";
import type { DateRange as DayPickerDateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useDashboardFilterStore,
  type DatePreset,
} from "@/store/dashboard-filter-store";

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: "7D", label: "7 Days" },
  { value: "30D", label: "30 Days" },
  { value: "90D", label: "90 Days" },
  { value: "YTD", label: "Year to Date" },
  { value: "1Y", label: "1 Year" },
  { value: "ALL", label: "All Time" },
];

interface DateRangePickerProps {
  className?: string;
}

export function DateRangePicker({ className }: DateRangePickerProps) {
  const { dateRange, setDateRange, setDatePreset } = useDashboardFilterStore();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [pendingRange, setPendingRange] = useState<
    DayPickerDateRange | undefined
  >(undefined);

  const handlePresetClick = (preset: DatePreset) => {
    setDatePreset(preset);
  };

  const handleCustomClick = () => {
    setPendingRange({
      from: dateRange.startDate,
      to: dateRange.endDate,
    });
    setCalendarOpen(true);
  };

  const handleDateRangeSelect = (range: DayPickerDateRange | undefined) => {
    setPendingRange(range);
  };

  const handleApplyRange = () => {
    if (pendingRange?.from) {
      setDateRange({
        startDate: pendingRange.from,
        endDate: pendingRange.to || pendingRange.from,
        preset: "custom",
      });
      setCalendarOpen(false);
      setPendingRange(undefined);
    }
  };

  const handleCancelRange = () => {
    setCalendarOpen(false);
    setPendingRange(undefined);
  };

  const isCustomRange = dateRange.preset === "custom";
  const currentPreset = DATE_PRESETS.find((p) => p.value === dateRange.preset);
  const displayText = isCustomRange
    ? `${format(dateRange.startDate, "MMM d")} - ${format(dateRange.endDate, "MMM d, yyyy")}`
    : currentPreset?.label || "Select";

  return (
    <div className={cn("flex items-center", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="inline-flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors">
            <CalendarIcon className="h-4 w-4" />
            {displayText}
            <ChevronDown className="h-3 w-3 opacity-50" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {DATE_PRESETS.map((preset) => (
            <DropdownMenuItem
              key={preset.value}
              onClick={() => handlePresetClick(preset.value)}
              className={cn(dateRange.preset === preset.value && "bg-accent")}
            >
              {preset.label}
            </DropdownMenuItem>
          ))}
          <DropdownMenuItem
            onClick={handleCustomClick}
            className={cn(isCustomRange && "bg-accent")}
          >
            Custom Range...
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={calendarOpen} onOpenChange={setCalendarOpen}>
        <DialogContent className="sm:max-w-fit">
          <DialogHeader>
            <DialogTitle>Select Date Range</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Calendar
              mode="range"
              defaultMonth={dateRange.startDate}
              selected={pendingRange}
              onSelect={handleDateRangeSelect}
              numberOfMonths={2}
            />
            <div className="flex justify-end gap-2 pt-4 border-t mt-4">
              <button
                onClick={handleCancelRange}
                className="px-3 py-1.5 text-sm font-medium rounded-md border hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyRange}
                disabled={!pendingRange?.from}
                className="px-3 py-1.5 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
