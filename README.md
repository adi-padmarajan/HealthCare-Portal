# HealthCare Portal

A patient appointment booking application for clinics: patients pick a physician, schedule a visit, and manage their bookings; clinic staff confirm or cancel requests, watch today's schedule, and review an audit trail of every status change. The app started as a Figma Make prototype and was hardened across seven phases — type safety, mocked REST + server state, auth and RBAC, validated forms, healthcare-specific safeguards (PHI, audit, timezones), accessibility, and a fully functional admin portal with tests.

This README reflects the state on `production-hardening`. The original prototype is preserved in the initial commits.

## Demo

A short walkthrough of both flows: **[Demo.mp4](./Demo.mp4)** (~10 MB). Open it locally to play; most markdown renderers won't auto-embed video from a relative link.

## Running the project

### Prerequisites

- Node 18+
- npm 9+ (the lockfile is `package-lock.json`)

### First run

```sh
git clone <repo-url> healthcare-portal
cd healthcare-portal
npm install
cp .env.example .env   # mock API is on by default; no other config needed for local dev
npm run dev
```

The dev server listens on `http://localhost:5173`. The mock API (MSW) intercepts every request to `/api/*`, so no backend is required.

### Sign in

The mock auth provider seeds two accounts. The dev login screen also displays them as a reminder; both are stripped from production builds via `import.meta.env.DEV` gates.

| Role    | Email                  | Password    |
| ------- | ---------------------- | ----------- |
| Admin   | `admin@example.com`    | `Demo1234!` |
| Patient | `patient@example.com`  | `Demo1234!` |

Sign-up creates additional patient accounts that persist for the session.

### Quality scripts

```sh
npm run typecheck     # tsc --noEmit
npm run lint          # ESLint (strict TS + React Hooks + jsx-a11y)
npm test              # Vitest unit + component (jsdom)
npm run test:e2e      # Playwright (auto-starts dev server)
npm run build         # tsc + vite build
```

Browser binaries for Playwright need a one-time `npx playwright install chromium`.

## What's built

### Patient experience

- Login / sign-up with Zod-validated forms and inline error messaging
- Four-step booking wizard: pick physician → date & time → patient details → review
- Slot-availability check that honors a server-side `DOUBLE_BOOKED` 409 — the optimistic create rolls back and routes the user back to time selection
- "My Appointments" view scoped to the authenticated user's email (server-enforced — patients can't see other patients' bookings)
- Cancellation with toast feedback

### Admin experience

- Tabbed dashboard (Pending / Confirmed / Cancelled / All) with live count badges that reflect the active search and date filter
- Confirm and Cancel actions wired to optimistic mutations; Cancel always opens a status-aware confirmation dialog (Pending vs. Confirmed copy differs)
- Header stats: Pending count, Confirmed Today, Cancelled This Week (last 7 days, derived from audit log timestamps)
- Detail drawer per booking with full patient/appointment info, visit reason, and an Activity timeline of audit log entries scoped to that booking
- Search by patient name or booking ID, plus a date-range filter (Today / This week / This month / Custom). State persists across tab switches.
- Per-tab empty states that distinguish "filtered to zero" from "genuinely empty," with a one-click clear-filters affordance
- Read-only audit-log panel for compliance review

### Cross-cutting

- Authentication with role-based access control. MSW handlers enforce 401/403 — a patient cannot reach an admin endpoint client- or server-side
- Mocked REST API (MSW browser worker for dev; MSW node server for tests) reusing one handler set
- TanStack Query for server state with optimistic updates + snapshot rollback
- Centralized `ApiError` and a global error boundary. Toasts via sonner for transient feedback
- WCAG 2.1 AA: labelled inputs, accessible action buttons, polite live region for status changes, focus-trapped dialogs and drawers
- Timezone-aware date handling: `YYYY-MM-DD` strings parse as local midnight to avoid UTC shifts
- PHI-safe logging and soft-delete with audit retention per HIPAA

## Key technical decisions

| Decision | Why | Tradeoff |
| -------- | --- | -------- |
| **Clerk** (mocked) for auth — [ADR-001](./docs/decisions/auth-provider.md) | React-first SDK with a BAA path, cookie sessions; the mock mirrors Clerk's hook surface so the future migration is a provider swap | Live integration is deferred; the dev mock token isn't signed |
| **MSW** for the mock API — [docs/api/README.md](./docs/api/README.md) | Exercises the real fetch/query/mutation pipeline (401/403/409 included) without a backend; the same handlers run server-side for component tests | Requires shipping `public/mockServiceWorker.js`; not a substitute for backend correctness |
| **TanStack Query** for server state | Cache + optimistic update + rollback come for free; replaces the prototype's prop-drilled local state | One more abstraction to learn |
| **React Hook Form + Zod** | Resolver pattern keeps validation in `src/lib/schemas/`; `aria-invalid` / `aria-describedby` wiring is straightforward | More setup than uncontrolled forms |
| **date-fns + date-fns-tz** | Tree-shakable; date-only strings parse as local midnight via `parseCalendarDate` to avoid the UTC-shift bug | Discipline — every read of a date-only field must go through the helper |
| **Soft-delete + audit retention** — [ADR-002](./docs/decisions/data-retention.md) | HIPAA requires 6-year retention; soft-delete preserves the audit trail and accounting-of-disclosures while hiding records from normal queries | Slightly more complex list queries; the hard-purge cron is out of scope |
| **Vitest + Playwright** | Vitest reuses the Vite resolver so component tests share module resolution with the app; Playwright covers the cross-tab admin loop that's hard to assert in jsdom | Two test runners to learn |

## Product decisions and UX judgment

- **Pending is the default admin tab.** That's where the work lives — landing anywhere else forces the admin to filter before acting.
- **Cancellation requires a confirmation dialog; confirmation doesn't.** A clicked Confirm is the happy path; gating it would be unnecessary friction. A clicked Cancel notifies the patient and removes a real appointment, so it stages the action and asks "are you sure?"
- **Confirmed-booking cancellation gets stronger copy.** Pending: "the patient will be notified that this request was cancelled." Confirmed: acknowledges the patient already got a confirmation notice and will get a second one. The asymmetric stakes warrant asymmetric copy.
- **You can cancel a Confirmed booking, but you cannot re-confirm a Cancelled one.** Patients legitimately call to cancel after confirmation. Re-confirming a cancellation, by contrast, would let admins paper over conflicts and erase history; the server returns `INVALID_TRANSITION` and the UI hides the Confirm action on Cancelled rows.
- **Tab count badges reflect the active filter, not the unfiltered totals.** If the badge says "Pending 12" but the table shows 3 rows after a date filter, the admin has to mentally reconcile the difference. The badge matches what's on screen.
- **Filter state persists across tab switches.** An admin investigating "this week's cancellations" expects Pending to stay scoped to this week when they hop over to triage new requests.
- **Activity history lives in the drawer, not the row.** Per-row history would be noisy on a busy table and most rows have nothing to show. Pulling it into the drawer rewards admins who care without taxing the default view.
- **Audit logging is admin-only.** Patients shouldn't see admin actions on their bookings, and per ADR-002 the log carries no PHI beyond booking IDs — safe for admin consumption.
- **Empty states distinguish "filtered to zero" from "genuinely empty."** A one-click "Clear filters" appears only when filters are the cause; otherwise the tab-specific copy stands alone.

## Architecture at a glance

The app is organized by feature, not file type. Each feature owns its UI; shared concerns (auth, API, query setup) live in `services/` and `lib/`. UI primitives (shadcn/Radix) sit in `components/ui/` and are consumed unchanged.

```
src/
  app/             App shell, auth gate
  features/        admin / auth / booking / patient / physicians
  components/      shadcn primitives + async-state + error-boundary
  services/        api.ts, queries.ts, queryClient.ts, authToken.ts, mockData.ts
  mocks/           MSW browser worker + handlers
  lib/             date.ts, schemas/ (Zod), utils.ts
  types/           Domain models (Booking, Physician, AuditLogEntry, ...)
  test/            MSW node server, render helpers, setup
e2e/               Playwright specs
docs/              audit.md, api/, decisions/ (ADRs)
```

`src/services/api.ts` is the only place that touches `fetch`. Components consume it through TanStack Query hooks in `src/services/queries.ts`, so swapping MSW for a real backend is a change of two env vars (`VITE_API_BASE_URL`, `VITE_ENABLE_MOCK_API`).

## Reliability and quality

**Tests**

- Unit: `src/features/admin/stats.test.ts`, `dateFilter.test.ts` — deterministic `now`, no React, fast.
- Component: `src/features/admin/AdminView.test.tsx` — covers Pending → Confirmed, Pending → Cancelled (with dialog), optimistic rollback on a 500, and the cancelled-can't-be-reconfirmed UI rule. Uses MSW Node so the real query/mutation pipeline runs.
- E2E: `e2e/admin.spec.ts` — login → confirm a Pending booking → cancel the now-Confirmed booking via the dialog → verify it lands in Cancelled.

Run the full local suite:

```sh
npm run typecheck && npm run lint && npm test && npm run test:e2e
```

**Error handling**

- Root `ErrorBoundary` (`src/components/error-boundary.tsx`) catches render-phase errors and shows a recovery UI that doesn't leak PHI.
- `ApiError` exposes a stable `code` field; the UI branches on codes like `DOUBLE_BOOKED` and `INVALID_TRANSITION` for status-specific feedback rather than a generic "something went wrong."
- Mutations use TanStack Query optimistic updates with snapshot rollback on error — the booking row reverts when a 500 hits.

**Accessibility**

- Form inputs are programmatically associated with labels (`htmlFor`) and errors (`aria-invalid` + `aria-describedby`).
- Icon-only action buttons carry row-scoped `aria-label`s.
- A polite live region announces status changes for screen readers.
- Drawers (vaul) and AlertDialog (Radix) trap focus and restore on close.
- WCAG AA contrast was verified during the [initial audit](./docs/audit.md).

## What I'd improve with more time

Priority-ordered. Each item is something the codebase concretely lacks today.

1. **Replace MSW with a real backend.** The REST contract is documented in [`docs/api/README.md`](./docs/api/README.md) and the service layer is already typed against it. Swap the env vars and the same components keep working. The work is on the backend side — the frontend is ready.
2. **Real-time updates via websockets or SSE.** Today the patient and admin views only see each other's changes on refetch, plus the audit log's 30-second poll. A push channel scoped to the user/clinic would close the gap and remove the need for polling. Medium effort.
3. **Notifications (email/SMS) on status change.** The dialog copy already promises "the patient will be notified" — that's currently aspirational. A small server-side worker plus templates delivers on it. Small effort once a backend exists.
4. **Patient-facing rescheduling.** A patient who needs to move an appointment must cancel and rebook today. A `Reschedule` action that swaps slots atomically would respect the cancelled-can't-be-reconfirmed rule and save a second form. Small.
5. **Server-side slot-level locking.** Double-booking prevention is reactive (a 409 at submit). A short pre-commit reservation would close the small race between availability fetch and submit, and is the right place for recurring-appointment and provider-blocking features to land. Medium.
6. **Observability: wire up Sentry.** The DSN is already stubbed in `.env.example`; connecting `@sentry/react` plus a `beforeSend` PHI scrubber lets us track production errors without leaking patient data. Small.
7. **Internationalization.** Timezone handling is in place; copy is English-only. Wrap user-facing strings with an i18n library and seed translations. Medium, mostly mechanical.
8. **Hard-purge cron for the retention window.** ADR-002 documents the policy (6 years, soft-delete first); production needs a scheduled job that hard-deletes records past the window after a legal-hold check. Small once a backend job runner exists.

## Attributions and licensing

Built with [shadcn/ui](https://ui.shadcn.com/) (Radix + Tailwind 4) — see [ATTRIBUTIONS.md](./ATTRIBUTIONS.md). Licensed under [MIT](./LICENSE).
