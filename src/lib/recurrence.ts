/**
 * Recurrence calculation utilities for recurring transactions
 */

export type RecurrenceFrequency =
  | "daily"
  | "weekly"
  | "biweekly"
  | "monthly"
  | "quarterly"
  | "yearly"
  | "custom";

export type CustomUnit = "days" | "weeks" | "months" | "years";

export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  customInterval?: number;
  customUnit?: CustomUnit;
  dayOfWeekMask?: number | null; // Bitmask: 1=Sun, 2=Mon, 4=Tue, 8=Wed, 16=Thu, 32=Fri, 64=Sat
  dayOfMonth?: number | null; // 1-31 or -1 for last day
  startDate: Date;
  endDate?: Date | null;
}

/**
 * Day of week constants for bitmask operations
 */
export const DAY_OF_WEEK = {
  SUNDAY: 1,
  MONDAY: 2,
  TUESDAY: 4,
  WEDNESDAY: 8,
  THURSDAY: 16,
  FRIDAY: 32,
  SATURDAY: 64,
} as const;

/**
 * Check if a specific day of week is selected in the bitmask
 * @param mask - The bitmask value
 * @param dayIndex - Day index (0=Sunday, 1=Monday, ..., 6=Saturday)
 */
export function isDayOfWeekSelected(mask: number, dayIndex: number): boolean {
  const dayBit = 1 << dayIndex;
  return (mask & dayBit) !== 0;
}

/**
 * Get the last day of a given month
 * @param year - The year
 * @param month - The month (0-indexed: 0=January, 11=December)
 */
export function getLastDayOfMonth(year: number, month: number): number {
  // Create date for first day of next month, then go back one day
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Add days to a date
 */
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Add months to a date, handling month-end edge cases
 * If the target month doesn't have the same day (e.g., Jan 31 -> Feb),
 * it will use the last day of that month
 */
function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  const targetMonth = result.getMonth() + months;
  const originalDay = result.getDate();

  result.setMonth(targetMonth);

  // Handle month overflow (e.g., Jan 31 + 1 month = Mar 3, should be Feb 28)
  if (result.getDate() !== originalDay) {
    // Go back to the last day of the intended month
    result.setDate(0);
  }

  return result;
}

/**
 * Add years to a date, handling Feb 29 leap year edge case
 */
function addYears(date: Date, years: number): Date {
  const result = new Date(date);
  const originalMonth = result.getMonth();

  result.setFullYear(result.getFullYear() + years);

  // Handle leap year edge case (Feb 29 in non-leap year)
  if (result.getMonth() !== originalMonth) {
    result.setDate(0); // Go back to Feb 28
  }

  return result;
}

/**
 * Find the next day matching the day-of-week mask
 * @param fromDate - Starting date (exclusive)
 * @param mask - Day of week bitmask
 */
function findNextDayOfWeek(fromDate: Date, mask: number): Date {
  if (mask === 0) {
    throw new Error("Day of week mask cannot be 0");
  }

  let result = addDays(fromDate, 1);
  for (let i = 0; i < 7; i++) {
    if (isDayOfWeekSelected(mask, result.getDay())) {
      return result;
    }
    result = addDays(result, 1);
  }

  // Should never reach here if mask is valid
  return result;
}

/**
 * Get a date with a specific day of month, handling month-end cases
 * @param year - The year
 * @param month - The month (0-indexed)
 * @param dayOfMonth - The day (1-31, or -1 for last day)
 */
function getDateWithDayOfMonth(
  year: number,
  month: number,
  dayOfMonth: number,
): Date {
  if (dayOfMonth === -1) {
    // Last day of month
    return new Date(year, month + 1, 0);
  }

  const lastDay = getLastDayOfMonth(year, month);
  const actualDay = Math.min(dayOfMonth, lastDay);

  return new Date(year, month, actualDay);
}

/**
 * Calculate the next occurrence date based on recurrence rules
 * @param rule - The recurrence rule configuration
 * @param fromDate - Calculate next occurrence after this date (defaults to current occurrence)
 * @returns The next occurrence date, or null if past end date or no valid next date
 */
export function calculateNextOccurrence(
  rule: RecurrenceRule,
  fromDate: Date,
): Date | null {
  let nextDate: Date;

  switch (rule.frequency) {
    case "daily":
      nextDate = addDays(fromDate, 1);
      break;

    case "weekly":
      if (rule.dayOfWeekMask && rule.dayOfWeekMask > 0) {
        // Find next day matching the mask
        nextDate = findNextDayOfWeek(fromDate, rule.dayOfWeekMask);
      } else {
        // Simple weekly: same day next week
        nextDate = addDays(fromDate, 7);
      }
      break;

    case "biweekly":
      nextDate = addDays(fromDate, 14);
      break;

    case "monthly":
      if (rule.dayOfMonth !== undefined && rule.dayOfMonth !== null) {
        // Specific day of month
        const nextMonth = fromDate.getMonth() + 1;
        const nextYear = fromDate.getFullYear() + (nextMonth > 11 ? 1 : 0);
        const normalizedMonth = nextMonth % 12;
        nextDate = getDateWithDayOfMonth(
          nextYear,
          normalizedMonth,
          rule.dayOfMonth,
        );
      } else {
        // Same day next month
        nextDate = addMonths(fromDate, 1);
      }
      break;

    case "quarterly":
      if (rule.dayOfMonth !== undefined && rule.dayOfMonth !== null) {
        // Specific day of month, 3 months later
        const targetMonth = fromDate.getMonth() + 3;
        const targetYear =
          fromDate.getFullYear() + Math.floor(targetMonth / 12);
        const normalizedMonth = targetMonth % 12;
        nextDate = getDateWithDayOfMonth(
          targetYear,
          normalizedMonth,
          rule.dayOfMonth,
        );
      } else {
        nextDate = addMonths(fromDate, 3);
      }
      break;

    case "yearly":
      if (rule.dayOfMonth !== undefined && rule.dayOfMonth !== null) {
        // Specific day of month, next year
        nextDate = getDateWithDayOfMonth(
          fromDate.getFullYear() + 1,
          fromDate.getMonth(),
          rule.dayOfMonth,
        );
      } else {
        nextDate = addYears(fromDate, 1);
      }
      break;

    case "custom":
      if (!rule.customInterval || !rule.customUnit) {
        throw new Error(
          "Custom frequency requires customInterval and customUnit",
        );
      }
      switch (rule.customUnit) {
        case "days":
          nextDate = addDays(fromDate, rule.customInterval);
          break;
        case "weeks":
          nextDate = addDays(fromDate, rule.customInterval * 7);
          break;
        case "months":
          nextDate = addMonths(fromDate, rule.customInterval);
          break;
        case "years":
          nextDate = addYears(fromDate, rule.customInterval);
          break;
      }
      break;

    default:
      throw new Error(`Unknown frequency: ${rule.frequency}`);
  }

  // Check if next date is past end date
  if (rule.endDate && nextDate > rule.endDate) {
    return null;
  }

  return nextDate;
}

/**
 * Calculate the first occurrence date based on recurrence rules and start date
 * @param rule - The recurrence rule configuration
 * @returns The first occurrence date
 */
export function calculateFirstOccurrence(rule: RecurrenceRule): Date {
  const startDate = new Date(rule.startDate);

  // For weekly with day-of-week mask, find first matching day on or after start
  if (
    rule.frequency === "weekly" &&
    rule.dayOfWeekMask &&
    rule.dayOfWeekMask > 0
  ) {
    // Check if start date itself matches
    if (isDayOfWeekSelected(rule.dayOfWeekMask, startDate.getDay())) {
      return startDate;
    }
    // Find next matching day
    return findNextDayOfWeek(addDays(startDate, -1), rule.dayOfWeekMask);
  }

  // For monthly/quarterly/yearly with specific day of month
  if (
    (rule.frequency === "monthly" ||
      rule.frequency === "quarterly" ||
      rule.frequency === "yearly") &&
    rule.dayOfMonth !== undefined &&
    rule.dayOfMonth !== null
  ) {
    const targetDate = getDateWithDayOfMonth(
      startDate.getFullYear(),
      startDate.getMonth(),
      rule.dayOfMonth,
    );

    // If target day is before start date, move to next period
    if (targetDate < startDate) {
      if (rule.frequency === "monthly") {
        return getDateWithDayOfMonth(
          targetDate.getMonth() === 11
            ? targetDate.getFullYear() + 1
            : targetDate.getFullYear(),
          (targetDate.getMonth() + 1) % 12,
          rule.dayOfMonth,
        );
      } else if (rule.frequency === "quarterly") {
        const nextMonth = targetDate.getMonth() + 3;
        return getDateWithDayOfMonth(
          targetDate.getFullYear() + Math.floor(nextMonth / 12),
          nextMonth % 12,
          rule.dayOfMonth,
        );
      } else {
        return getDateWithDayOfMonth(
          targetDate.getFullYear() + 1,
          targetDate.getMonth(),
          rule.dayOfMonth,
        );
      }
    }
    return targetDate;
  }

  // For all other cases, start date is the first occurrence
  return startDate;
}

/**
 * Generate a preview of upcoming occurrence dates
 * @param rule - The recurrence rule configuration
 * @param count - Number of occurrences to generate (max 12)
 * @param fromDate - Starting point (defaults to first occurrence)
 * @returns Array of upcoming dates
 */
export function previewOccurrences(
  rule: RecurrenceRule,
  count: number = 5,
  fromDate?: Date,
): Date[] {
  const maxCount = Math.min(count, 12);
  const occurrences: Date[] = [];

  let currentDate = fromDate ?? calculateFirstOccurrence(rule);

  // Add first occurrence if it's valid
  if (!rule.endDate || currentDate <= rule.endDate) {
    occurrences.push(new Date(currentDate));
  }

  // Generate subsequent occurrences
  while (occurrences.length < maxCount) {
    const nextDate = calculateNextOccurrence(rule, currentDate);
    if (!nextDate) {
      break;
    }
    occurrences.push(nextDate);
    currentDate = nextDate;
  }

  return occurrences;
}

/**
 * Format a recurrence rule as a human-readable string
 * @param rule - The recurrence rule configuration
 * @returns Human-readable description
 */
export function formatRecurrenceRule(rule: RecurrenceRule): string {
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  switch (rule.frequency) {
    case "daily":
      return "Daily";

    case "weekly":
      if (rule.dayOfWeekMask && rule.dayOfWeekMask > 0) {
        const days = dayNames.filter((_, i) =>
          isDayOfWeekSelected(rule.dayOfWeekMask!, i),
        );
        return `Weekly on ${days.join(", ")}`;
      }
      return "Weekly";

    case "biweekly":
      return "Every 2 weeks";

    case "monthly":
      if (rule.dayOfMonth === -1) {
        return "Monthly on the last day";
      } else if (rule.dayOfMonth) {
        return `Monthly on the ${ordinal(rule.dayOfMonth)}`;
      }
      return "Monthly";

    case "quarterly":
      if (rule.dayOfMonth === -1) {
        return "Quarterly on the last day";
      } else if (rule.dayOfMonth) {
        return `Quarterly on the ${ordinal(rule.dayOfMonth)}`;
      }
      return "Quarterly";

    case "yearly":
      return "Yearly";

    case "custom":
      if (rule.customInterval && rule.customUnit) {
        const unit =
          rule.customInterval === 1
            ? rule.customUnit.slice(0, -1)
            : rule.customUnit;
        return `Every ${rule.customInterval} ${unit}`;
      }
      return "Custom";

    default:
      return "Unknown";
  }
}

/**
 * Convert a number to ordinal string (1st, 2nd, 3rd, etc.)
 */
function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/**
 * Create a day-of-week bitmask from an array of day indices
 * @param days - Array of day indices (0=Sunday, 1=Monday, ..., 6=Saturday)
 */
export function createDayOfWeekMask(days: number[]): number {
  return days.reduce((mask, day) => mask | (1 << day), 0);
}

/**
 * Extract selected days from a bitmask as an array of indices
 * @param mask - The bitmask value
 */
export function extractDaysFromMask(mask: number): number[] {
  const days: number[] = [];
  for (let i = 0; i < 7; i++) {
    if (isDayOfWeekSelected(mask, i)) {
      days.push(i);
    }
  }
  return days;
}
