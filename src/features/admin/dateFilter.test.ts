import { describe, expect, test } from "vitest";

import type { Booking } from "@/types";

import { matchesDateFilter } from "./dateFilter";

// Sunday in en-US, so startOfWeek/endOfWeek run Sun-Sat.
const NOW = new Date("2026-05-07T12:00:00-07:00"); // Thursday

function booking(date: string): Booking {
  return {
    appointmentType: "In-person",
    date,
    dateOfBirth: "1990-01-01",
    id: "B-x",
    insurance: "Blue Cross",
    insuranceMemberId: "X",
    isFirstTime: false,
    patientEmail: "a@b.com",
    patientName: "Test Patient",
    patientPhone: "555",
    physicianId: "phy-1",
    reason: "test",
    status: "Pending",
    time: "10:00 AM",
  };
}

describe("matchesDateFilter", () => {
  test("preset 'all' matches everything", () => {
    expect(matchesDateFilter(booking("2020-01-01"), { preset: "all" }, NOW)).toBe(true);
    expect(matchesDateFilter(booking("2099-12-31"), { preset: "all" }, NOW)).toBe(true);
  });

  test("preset 'today' matches only the current day", () => {
    expect(matchesDateFilter(booking("2026-05-07"), { preset: "today" }, NOW)).toBe(true);
    expect(matchesDateFilter(booking("2026-05-08"), { preset: "today" }, NOW)).toBe(false);
    expect(matchesDateFilter(booking("2026-05-06"), { preset: "today" }, NOW)).toBe(false);
  });

  test("preset 'week' covers Sunday through Saturday for an en-US Thursday", () => {
    // The week containing 2026-05-07 (Thu) is Sun 2026-05-03 to Sat 2026-05-09.
    expect(matchesDateFilter(booking("2026-05-03"), { preset: "week" }, NOW)).toBe(true);
    expect(matchesDateFilter(booking("2026-05-09"), { preset: "week" }, NOW)).toBe(true);
    expect(matchesDateFilter(booking("2026-05-02"), { preset: "week" }, NOW)).toBe(false);
    expect(matchesDateFilter(booking("2026-05-10"), { preset: "week" }, NOW)).toBe(false);
  });

  test("preset 'month' covers the full calendar month containing now", () => {
    expect(matchesDateFilter(booking("2026-05-01"), { preset: "month" }, NOW)).toBe(true);
    expect(matchesDateFilter(booking("2026-05-31"), { preset: "month" }, NOW)).toBe(true);
    expect(matchesDateFilter(booking("2026-04-30"), { preset: "month" }, NOW)).toBe(false);
    expect(matchesDateFilter(booking("2026-06-01"), { preset: "month" }, NOW)).toBe(false);
  });

  test("preset 'custom' applies an inclusive bounded range", () => {
    const filter = {
      from: new Date("2026-05-05T00:00:00-07:00"),
      preset: "custom" as const,
      to: new Date("2026-05-08T00:00:00-07:00"),
    };
    expect(matchesDateFilter(booking("2026-05-05"), filter, NOW)).toBe(true);
    expect(matchesDateFilter(booking("2026-05-08"), filter, NOW)).toBe(true);
    expect(matchesDateFilter(booking("2026-05-04"), filter, NOW)).toBe(false);
    expect(matchesDateFilter(booking("2026-05-09"), filter, NOW)).toBe(false);
  });

  test("preset 'custom' with no bounds matches everything (open range)", () => {
    expect(matchesDateFilter(booking("2020-01-01"), { preset: "custom" }, NOW)).toBe(true);
  });

  test("preset 'custom' with only `from` is unbounded above", () => {
    const filter = { from: new Date("2026-05-07T00:00:00-07:00"), preset: "custom" as const };
    expect(matchesDateFilter(booking("2026-05-07"), filter, NOW)).toBe(true);
    expect(matchesDateFilter(booking("2099-12-31"), filter, NOW)).toBe(true);
    expect(matchesDateFilter(booking("2026-05-06"), filter, NOW)).toBe(false);
  });
});
