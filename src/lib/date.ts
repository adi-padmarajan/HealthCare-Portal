/**
 * Date utilities for the HealthCare Portal.
 *
 * BACKGROUND
 * ----------
 * Dates stored in the booking model (e.g. "2026-05-09") are calendar-date
 * strings with no time component. `new Date("2026-05-09")` parses them as
 * UTC midnight, which shifts the displayed day by one in any timezone west
 * of UTC (e.g. US Eastern, Pacific). All date-only strings must go through
 * `parseCalendarDate` so they are interpreted as local midnight.
 *
 * Full ISO datetime strings that already carry a timezone offset (e.g. audit
 * log timestamps) should continue to use `new Date()` or `date-fns/parseISO`
 * directly, because the offset is embedded in the string.
 *
 * USAGE
 * -----
 *   // Render a YYYY-MM-DD field
 *   formatCalendarDate(booking.date, "EEEE, MMMM d, yyyy")  // "Thursday, May 9, 2026"
 *
 *   // When you need the Date object itself (e.g. for date-fns comparisons)
 *   parseCalendarDate(booking.dateOfBirth)
 */

import { format } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

/** The user's browser timezone (e.g. "America/New_York"). */
export const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

/**
 * Parse a YYYY-MM-DD calendar-date string as local midnight.
 * This avoids the UTC-shift that `new Date("YYYY-MM-DD")` introduces.
 */
export function parseCalendarDate(dateStr: string): Date {
  const parts = dateStr.split("-");
  const year = parseInt(parts[0] ?? "0", 10);
  const month = parseInt(parts[1] ?? "1", 10);
  const day = parseInt(parts[2] ?? "1", 10);
  return new Date(year, month - 1, day);
}

/**
 * Format a YYYY-MM-DD calendar-date string using the given date-fns format
 * pattern. The date is interpreted as local midnight (no UTC shift).
 */
export function formatCalendarDate(dateStr: string, pattern: string): string {
  return format(parseCalendarDate(dateStr), pattern);
}

/**
 * Format a full ISO datetime string in the user's browser timezone.
 * Use this for timestamps that carry a timezone offset (e.g. audit log entries).
 */
export function formatInUserZone(date: Date | string, pattern: string): string {
  return formatInTimeZone(date, userTimeZone, pattern);
}
