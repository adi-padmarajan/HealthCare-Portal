import { format, subDays } from "date-fns";

import type { AuditLogEntry, Booking } from "@/types";

export interface AdminStats {
  pending: number;
  confirmedToday: number;
  cancelledThisWeek: number;
}

/**
 * Derives the admin dashboard stats from the current booking list and the
 * append-only audit log.
 *
 * `cancelledThisWeek` is intentionally sourced from the audit log rather than
 * the booking record — the timestamp on a Booking only reflects its current
 * state, but ADR-002 makes the audit log the source of truth for transitions.
 * Deduping by targetId guards against a future where a booking acquires more
 * than one cancellation event.
 */
export function computeAdminStats(
  bookings: Booking[],
  auditEntries: AuditLogEntry[],
  now: Date = new Date(),
): AdminStats {
  const today = format(now, "yyyy-MM-dd");
  const weekAgoMs = subDays(now, 7).getTime();

  const cancelledIdsThisWeek = new Set<string>();
  for (const entry of auditEntries) {
    if (new Date(entry.timestamp).getTime() < weekAgoMs) continue;
    if (entry.action === "BOOKING_DELETED") {
      cancelledIdsThisWeek.add(entry.targetId);
      continue;
    }
    if (
      entry.action === "BOOKING_STATUS_UPDATED" &&
      entry.metadata?.newStatus === "Cancelled"
    ) {
      cancelledIdsThisWeek.add(entry.targetId);
    }
  }

  return {
    cancelledThisWeek: cancelledIdsThisWeek.size,
    confirmedToday: bookings.filter(
      (b) => b.status === "Confirmed" && b.date === today,
    ).length,
    pending: bookings.filter((b) => b.status === "Pending").length,
  };
}
