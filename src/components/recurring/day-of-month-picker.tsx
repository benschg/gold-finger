"use client";

import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface DayOfMonthPickerProps {
  value: number | null | undefined;
  onChange: (day: number | null) => void;
  disabled?: boolean;
}

export function DayOfMonthPicker({
  value,
  onChange,
  disabled,
}: DayOfMonthPickerProps) {
  const t = useTranslations("recurring");

  // Generate days 1-31 plus -1 for last day
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="space-y-2">
      <Label>{t("dayOfMonth")}</Label>
      <Select
        value={value?.toString() ?? "same"}
        onValueChange={(v) => onChange(v === "same" ? null : parseInt(v))}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue placeholder={t("selectDayOfMonth")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="same">{t("sameDay")}</SelectItem>
          <SelectItem value="-1">{t("lastDayOfMonth")}</SelectItem>
          {days.map((day) => (
            <SelectItem key={day} value={day.toString()}>
              {day}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
