# ADR-002: PHI Logging Policy and Data-Retention Strategy

## Status
Accepted

## Context
The application stores Protected Health Information (PHI) as defined by HIPAA in the `Booking` model:
`patientName`, `patientEmail`, `patientPhone`, `dateOfBirth`, `insurance`, `insuranceMemberId`, `reason`.

Two questions arise before building admin tooling and observability:
1. **Logging** — which fields may appear in logs, error messages, or browser DevTools output?
2. **Deletion** — when a booking is removed, should the record be destroyed or merely hidden?

## Decisions

### PHI Logging
PHI fields listed above **must never be written** to `console.*`, error payloads sent to the
client, log-shipping services, or analytics sinks.  Allowed in logs: booking IDs, physician IDs,
appointment dates/times, status transitions, and actor IDs (staff email).

Rationale: A hard-delete wipes PHI immediately but also erases the audit trail and makes anomaly
detection impossible.  A soft-delete retains the record (making it invisible to normal queries)
while allowing authorised administrators to investigate disputes, generate HIPAA accounting-of-
disclosures reports, and run retention-window jobs.

### Soft-Delete
Bookings gain a nullable `deletedAt: ISODateString | undefined` field.

| Behaviour | Details |
|-----------|---------|
| `DELETE /bookings/:id` | Sets `deletedAt = now`, sets `status = "Cancelled"`. Returns 204. |
| `GET /bookings` (list) | Excludes records where `deletedAt` is set. |
| `GET /bookings/:id` | Returns 404 if `deletedAt` is set. |
| Availability | Soft-deleted slots are treated as free (excluded from booked-slot check). |
| Hard purge | Out of scope for this prototype. A cron-based job would hard-delete records whose `deletedAt` is older than the retention window. |

### Retention Window
HIPAA requires covered entities to retain records for **6 years** from the date of creation or last
effective date.  In production, records with `deletedAt` older than 6 years are eligible for hard
purge after a secondary legal-hold check.

## Audit Log
Every status transition and soft-delete performed by an admin is recorded as an `AuditLogEntry`
(see `src/types/healthcare.ts`).  The audit log is admin-only, append-only, and must not contain
PHI beyond the booking ID.  `metadata` keys that are acceptable: `oldStatus`, `newStatus`,
`deletedAt`.

## Consequences
- Booking list queries are slightly more expensive (one extra filter predicate).
- The `Booking` TypeScript type gains an optional `deletedAt` field; callers that destructure it
  should treat it as optional and never render its value in patient-facing UI.
- A new `GET /api/audit-log` endpoint is added (admin-only) so compliance officers can review the
  change history without direct database access.

## Alternatives Considered
- **Hard-delete** — rejected; eliminates audit trail and complicates accounting-of-disclosures.
- **Status-only cancellation** (no delete endpoint) — rejected; admins legitimately need to remove
  test/erroneous bookings without keeping them visible in reports.

## References
- HIPAA 45 CFR §164.530(j) — record-retention requirements
- production-hardening roadmap, Phase 6
