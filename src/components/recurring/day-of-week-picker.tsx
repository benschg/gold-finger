"use client";

import { useTranslations } from "next-intl";
import { Toggle } from "@/components/ui/toggle";
import { Label } from "@/components/ui/label";
import { isDayOfWeekSelected, createDayOfWeekMask } from "@/lib/recurrence";

interface DayOfWeekPickerProps {
  value: number;
  onChange: (mask: number) => void;
  disabled?: boolean;
}

const DAYS = [
  { index: 0, key: "sunday" },
  { index: 1, key: "monday" },
  { index: 2, key: "tuesday" },
  { index: 3, key: "wednesday" },
  { index: 4, key: "thursday" },
  { index: 5, key: "friday" },
  { index: 6, key: "saturday" },
] as const;

export function DayOfWeekPicker({
  value,
  onChange,
  disabled,
}: DayOfWeekPickerProps) {
  const t = useTranslations("recurring");

  const toggleDay = (dayIndex: number) => {
    const isSelected = isDayOfWeekSelected(value, dayIndex);
    if (isSelected) {
      // Remove day from mask
      onChange(value & ~(1 << dayIndex));
    } else {
      // Add day to mask
      onChange(value | (1 << dayIndex));
    }
  };

  return (
    <div className="space-y-2">
      <Label>{t("daysOfWeek")}</Label>
      <div className="flex flex-wrap gap-1">
        {DAYS.map((day) => (
          <Toggle
            key={day.index}
            pressed={isDayOfWeekSelected(value, day.index)}
            onPressedChange={() => toggleDay(day.index)}
            disabled={disabled}
            size="sm"
            className="w-10 px-2"
            aria-label={t(day.key)}
          >
            {t(day.key)}
          </Toggle>
        ))}
      </div>
    </div>
  );
}
