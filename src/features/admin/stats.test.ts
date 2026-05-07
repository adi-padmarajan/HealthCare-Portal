import { describe, expect, test } from "vitest";

import type { AuditLogEntry, Booking } from "@/types";

import { computeAdminStats } from "./stats";

const NOW = new Date("2026-05-07T12:00:00-07:00");

function booking(overrides: Partial<Booking> = {}): Booking {
  return {
    appointmentType: "In-person",
    date: "2026-05-07",
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
    ...overrides,
  };
}

function audit(overrides: Partial<AuditLogEntry> = {}): AuditLogEntry {
  return {
    action: "BOOKING_STATUS_UPDATED",
    actorId: "admin@example.com",
    id: `aud-${Math.random()}`,
    targetId: "B-x",
    timestamp: NOW.toISOString(),
    ...overrides,
  };
}

describe("computeAdminStats", () => {
  test("counts pending bookings regardless of date", () => {
    const stats = computeAdminStats(
      [booking({ id: "B1", status: "Pending", date: "2026-05-01" }), booking({ id: "B2", status: "Pending", date: "2026-12-31" }), booking({ id: "B3", status: "Confirmed" })],
      [],
      NOW,
    );
    expect(stats.pending).toBe(2);
  });

  test("confirmedToday only counts Confirmed bookings whose date matches today", () => {
    const stats = computeAdminStats(
      [
        booking({ id: "B1", status: "Confirmed", date: "2026-05-07" }),
        booking({ id: "B2", status: "Confirmed", date: "2026-05-08" }),
        booking({ id: "B3", status: "Pending", date: "2026-05-07" }),
      ],
      [],
      NOW,
    );
    expect(stats.confirmedToday).toBe(1);
  });

  test("cancelledThisWeek counts BOOKING_STATUS_UPDATED to Cancelled within last 7 days", () => {
    const audits = [
      audit({
        targetId: "B1",
        timestamp: new Date("2026-05-06T10:00:00Z").toISOString(),
        metadata: { newStatus: "Cancelled", oldStatus: "Pending" },
      }),
      audit({
        targetId: "B2",
        timestamp: new Date("2026-05-02T10:00:00Z").toISOString(),
        metadata: { newStatus: "Cancelled", oldStatus: "Confirmed" },
      }),
      // outside window — 8 days ago
      audit({
        targetId: "B3",
        timestamp: new Date("2026-04-29T10:00:00Z").toISOString(),
        metadata: { newStatus: "Cancelled", oldStatus: "Pending" },
      }),
    ];
    const stats = computeAdminStats([], audits, NOW);
    expect(stats.cancelledThisWeek).toBe(2);
  });

  test("cancelledThisWeek dedupes by booking id when multiple events exist", () => {
    const sameId = "B-shared";
    const audits = [
      audit({
        id: "a1",
        targetId: sameId,
        timestamp: new Date("2026-05-05T10:00:00Z").toISOString(),
        metadata: { newStatus: "Cancelled", oldStatus: "Pending" },
      }),
      audit({
        id: "a2",
        action: "BOOKING_DELETED",
        targetId: sameId,
        timestamp: new Date("2026-05-06T10:00:00Z").toISOString(),
        metadata: { deletedAt: NOW.toISOString() },
      }),
    ];
    const stats = computeAdminStats([], audits, NOW);
    expect(stats.cancelledThisWeek).toBe(1);
  });

  test("ignores BOOKING_STATUS_UPDATED entries that aren't transitions to Cancelled", () => {
    const audits = [
      audit({
        targetId: "B1",
        timestamp: new Date("2026-05-06T10:00:00Z").toISOString(),
        metadata: { newStatus: "Confirmed", oldStatus: "Pending" },
      }),
    ];
    const stats = computeAdminStats([], audits, NOW);
    expect(stats.cancelledThisWeek).toBe(0);
  });
});
