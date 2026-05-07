import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";

import { parseCalendarDate } from "@/lib/date";
import type { Booking } from "@/types";

export type DateFilterPreset = "all" | "today" | "week" | "month" | "custom";

export interface DateFilter {
  preset: DateFilterPreset;
  /** Inclusive start of a custom range. Only honored when preset === "custom". */
  from?: Date;
  /** Inclusive end of a custom range. Only honored when preset === "custom". */
  to?: Date;
}

export const ALL_DATES: DateFilter = { preset: "all" };

export const PRESET_LABELS: Record<DateFilterPreset, string> = {
  all: "All dates",
  custom: "Custom range",
  month: "This month",
  today: "Today",
  week: "This week",
};

interface ResolvedRange {
  from?: Date;
  to?: Date;
}

function resolveRange(filter: DateFilter, now: Date): ResolvedRange {
  switch (filter.preset) {
    case "all":
      return {};
    case "today":
      return { from: startOfDay(now), to: endOfDay(now) };
    case "week":
      // date-fns defaults to a Sunday-start week in the en-US locale, which
      // matches how a US-based clinic admin would read "this week".
      return { from: startOfWeek(now), to: endOfWeek(now) };
    case "month":
      return { from: startOfMonth(now), to: endOfMonth(now) };
    case "custom":
      return {
        from: filter.from ? startOfDay(filter.from) : undefined,
        to: filter.to ? endOfDay(filter.to) : undefined,
      };
  }
}

/** True if the booking's appointment date falls within the active filter. */
export function matchesDateFilter(
  booking: Booking,
  filter: DateFilter,
  now: Date = new Date(),
): boolean {
  const range = resolveRange(filter, now);
  if (!range.from && !range.to) return true;

  const bookingTime = parseCalendarDate(booking.date).getTime();
  if (range.from && bookingTime < range.from.getTime()) return false;
  if (range.to && bookingTime > range.to.getTime()) return false;
  return true;
}
