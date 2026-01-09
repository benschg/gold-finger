"use client";

import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { RecurrenceFrequency, CustomUnit } from "@/types/database";

interface FrequencySelectorProps {
  value: RecurrenceFrequency;
  onChange: (value: RecurrenceFrequency) => void;
  customInterval?: number;
  customUnit?: CustomUnit;
  onCustomIntervalChange?: (interval: number) => void;
  onCustomUnitChange?: (unit: CustomUnit) => void;
  disabled?: boolean;
}

export function FrequencySelector({
  value,
  onChange,
  customInterval = 1,
  customUnit = "days",
  onCustomIntervalChange,
  onCustomUnitChange,
  disabled,
}: FrequencySelectorProps) {
  const t = useTranslations("recurring");

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label>{t("frequency")}</Label>
        <Select value={value} onValueChange={onChange} disabled={disabled}>
          <SelectTrigger>
            <SelectValue placeholder={t("selectFrequency")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">{t("daily")}</SelectItem>
            <SelectItem value="weekly">{t("weekly")}</SelectItem>
            <SelectItem value="biweekly">{t("biweekly")}</SelectItem>
            <SelectItem value="monthly">{t("monthly")}</SelectItem>
            <SelectItem value="quarterly">{t("quarterly")}</SelectItem>
            <SelectItem value="yearly">{t("yearly")}</SelectItem>
            <SelectItem value="custom">{t("custom")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {value === "custom" && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{t("every")}</span>
          <Input
            type="number"
            min={1}
            value={customInterval}
            onChange={(e) =>
              onCustomIntervalChange?.(parseInt(e.target.value) || 1)
            }
            className="w-20"
            disabled={disabled}
          />
          <Select
            value={customUnit}
            onValueChange={(v) => onCustomUnitChange?.(v as CustomUnit)}
            disabled={disabled}
          >
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="days">{t("days")}</SelectItem>
              <SelectItem value="weeks">{t("weeks")}</SelectItem>
              <SelectItem value="months">{t("months")}</SelectItem>
              <SelectItem value="years">{t("years")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
