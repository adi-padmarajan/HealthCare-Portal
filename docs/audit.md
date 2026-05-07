# Codebase Audit

Date: 2026-05-07
Branch: `production-hardening`

This audit establishes the current baseline for the Figma Make export before
production hardening work begins.

## Repository And Build Baseline

- The project is already a git repository on branch `production-hardening`.
- The working tree was clean before the audit work started.
- `npm run build` succeeds with Vite and emits:
  - `dist/index.html`: 0.53 kB
  - `dist/assets/*.css`: 91.72 kB, 14.62 kB gzip
  - `dist/assets/*.js`: 391.14 kB, 121.13 kB gzip
- The generated `dist/` output is not currently ignored by `.gitignore`; it was
  removed after the build check so this audit commit only records source docs.

## Framework, Language, And Dependencies

- Framework: React single-page application rendered from `src/main.tsx`.
- Build tool: Vite 6.4.2 with `@vitejs/plugin-react` and Tailwind CSS 4.
- Language: TypeScript syntax is used in `.ts` and `.tsx` files, but the project
  is not configured for TypeScript type checking.
- Styling: Tailwind 4 CSS files under `src/styles/`, with shadcn/Radix-style UI
  primitives under `src/app/components/ui/`.
- Package manager state: `package-lock.json` exists and `node_modules` is
  installed. `pnpm-workspace.yaml` also exists, but the lockfile and documented
  install command point to npm.

Security and currency checks:

- `npm audit --audit-level=low` reports 0 known vulnerabilities.
- `npm outdated --long` shows notable version drift:
  - React and React DOM are installed at 18.3.1 while 19.2.6 is latest.
  - Vite is installed at 6.4.2 while 8.0.11 is latest.
  - `@vitejs/plugin-react` is installed at 4.7.0 while 6.0.1 is latest.
  - MUI packages are installed at 7.3.5 while 9.0.1 is latest.
  - Many Radix primitives are pinned to older 1.x/2.x releases.
  - `date-fns` is installed at 3.6.0 while 4.1.0 is latest.
  - `react-day-picker` is installed at 8.10.1 while 9.14.0 is latest.
  - `recharts` is installed at 2.15.2 while 3.8.1 is latest.
- The app imports a broad generated UI inventory. Several dependencies appear to
  exist only because unused UI primitives were exported with the prototype, so
  dependency trimming should follow feature stabilization.

## Component Architecture And State Management

The app is currently a small component tree around one stateful root:

- `src/main.tsx` mounts `App`.
- `src/app/App.tsx` owns:
  - `userRole`, a local `"patient" | "admin"` toggle.
  - `bookings`, initialized from `initialBookings`.
  - booking creation, cancellation, and status update handlers.
- `src/app/components/PatientView.tsx` owns the booking wizard state:
  - view mode
  - current step
  - selected physician
  - selected date and time
  - appointment type
  - patient details
  - last booking id for the confirmation screen
- `src/app/components/AdminView.tsx` owns admin-only UI state:
  - search term
  - status filter
  - selected booking drawer
  - unused `viewMode`
- Booking step components are split by screen:
  - `StepPhysician`
  - `StepDateTime`
  - `StepPatientDetails`
  - `StepReview`
  - `BookingConfirmation`

State management is entirely local React state. There is no router-level state,
server-state cache, backend service layer, persistence, authentication context,
or authorization boundary. This is appropriate for a prototype but not for a
production appointment system.

## Mock Data And Data Flow

Mock data lives in `src/app/data/mockData.ts`.

It exports:

- `Physician`
- `Booking`
- `physicians`
- `initialBookings`
- `insuranceProviders`
- `timeSlots`

Data flow:

- `App.tsx` imports `initialBookings` and stores it in local component state.
- `PatientView.tsx`, `AdminView.tsx`, `StepPhysician.tsx`, `StepDateTime.tsx`,
  and `StepReview.tsx` import mock data directly.
- `PatientView` submits a booking payload back to `App`.
- `App` creates a separate random booking id and appends the booking in memory.
- `PatientView` also creates its own random booking id for the confirmation UI,
  which can differ from the actual id stored by `App`.
- The patient appointments view currently leaks all bookings because it filters
  with `booking.patientEmail === patientDetails.email || bookings.length > 0`.
  When any booking exists, every booking is shown.

Production implications:

- Mock PHI-like patient data is committed to source.
- There is no durable record source.
- There is no double-booking prevention.
- Availability is represented by a hard-coded local array in `StepDateTime`.
- Status transitions are unconstrained client-side mutations.

## TypeScript Coverage

- The repository has 62 `.ts`/`.tsx` files.
- There is no root `tsconfig.json`.
- There is no `typescript` dependency.
- There is no `typecheck` script.
- Vite transpiles the code, but the build does not run static type checking.
- Domain interfaces are currently colocated with mock data rather than in a
  shared domain model.
- Useful domain types exist only partially:
  - `Physician`
  - `Booking`
  - `PatientDetails`
- Missing or incomplete domain types include:
  - `Patient`
  - `Appointment`
  - `BookingStatus`
  - `AppointmentType`
  - `AvailabilitySlot`
  - `AuditLogEntry`
  - request and response DTOs for API calls

## Accessibility Review

Positive baseline:

- The generated Radix-based primitives generally include good focus-ring
  styling and ARIA support when used correctly.
- Native buttons are used for most actions.
- The table in `AdminView` uses semantic table elements.
- Core color pairs checked during the audit meet WCAG AA contrast for normal
  text:
  - muted text on white: 4.76:1
  - primary blue on white: 5.17:1
  - white on primary blue: 5.17:1
  - pending badge text/background: 6.37:1
  - confirmed badge text/background: 6.78:1
  - cancelled badge text/background: 6.80:1
  - destructive red on white: 4.83:1

Gaps:

- Most visible `<label>` elements in `StepPatientDetails` do not use `htmlFor`,
  so inputs are not programmatically associated with their labels.
- Search inputs in `StepPhysician` and `AdminView` rely on placeholders instead
  of accessible labels.
- The appointment type buttons behave like a segmented control but do not expose
  pressed state with `aria-pressed` or use a radio-group pattern.
- Time slot buttons do not expose selection state with `aria-pressed` or an
  equivalent pattern.
- Form error messages are displayed visually but are not connected to inputs
  with `aria-invalid` and `aria-describedby`.
- Icon-only buttons for cancel, view, confirm, and reject actions do not include
  accessible names.
- The progress-step indicator is visual only and does not announce current step
  semantics.
- Confirmation and status changes are not announced through a live region.
- Drawer focus behavior comes from `vaul`, but the appointment details drawer
  still needs keyboard and screen reader validation after real data is wired in.

## Code Smells And Architectural Issues

- `AdminView.tsx` is 314 lines and mixes filtering, stats, table rendering,
  drawer rendering, and status transitions.
- `PatientView.tsx` is 230 lines and owns most booking wizard orchestration.
- `src/app/components/ui/sidebar.tsx` is 726 lines and appears unused in this
  app, suggesting broad prototype export residue.
- Domain types are tied to mock data instead of reusable production models.
- There is prop drilling from `App` into patient/admin views for booking
  mutations.
- There is no error boundary.
- There are no loading, error, or empty states for async data because no async
  data layer exists yet.
- There are no tests.
- There are no lint or format checks.
- There are unused imports and state:
  - `AdminView` imports `Filter`, `LayoutGrid`, and `LayoutList` but does not use
    them.
  - `AdminView` defines `viewMode` but does not use it.
  - `StepReview` imports `Clock`, `Phone`, `Mail`, and `CreditCard` but does not
    use them.
- Random booking ids are generated in two places and can disagree between the
  saved booking and the confirmation screen.
- Date handling uses local `Date` parsing and formatting without timezone
  modeling. Date-only strings such as `2026-05-09` can display differently
  across timezones.
- The admin "Cancelled This Week" stat counts all cancelled bookings, not only
  bookings cancelled in the past seven days.
- The patient appointments view leaks all bookings.

## PHI And Healthcare Security Concerns

The prototype currently handles PHI-like data without production safeguards:

- Mock patient names, emails, phone numbers, dates of birth, insurance providers,
  member ids, and visit reasons are committed in source.
- There is no authentication.
- There is no authorization or role-based access control.
- The admin view is reachable through a client-side role toggle.
- Patients can currently see other patients' bookings due to the broken patient
  filter.
- There is no API boundary where server-side authorization can be enforced.
- There is no audit log for admin actions such as confirming or cancelling an
  appointment.
- There is no retention, cancellation deletion, or data minimization policy in
  code or docs.
- Error handling is not centralized, so future errors could accidentally expose
  patient data unless sanitized deliberately.
- The app does not currently use localStorage or sessionStorage for PHI, which is
  good, but future persistence should avoid storing patient records in browser
  storage.
- No PHI should be placed in URL params, analytics events, console logs, crash
  reports, or third-party telemetry.

## Recommended Phase Priorities

The safest path is:

1. Foundation hardening: TypeScript strict mode, linting, formatting, domain
   types, environment placeholders, error boundaries, and notifications.
2. Backend integration layer: typed API contract, TanStack Query, loading/error
   states, MSW, and backend handoff docs.
3. Authentication and authorization: provider decision ADR, RBAC scaffolding,
   protected admin access, and patient data scoping.
4. Forms and validation: React Hook Form, Zod schemas, input masks, and
   submission-time availability checks.
5. Healthcare-specific safeguards: PHI handling rules, audit logging hooks,
   timezone strategy, retention/deletion paths, and WCAG 2.1 AA remediation.
6. Testing, performance, and deployment readiness.

## Verification Commands

Commands run during audit:

```sh
git rev-parse --is-inside-work-tree
git status --short --branch
npm ls --depth=0
npm run build
npm audit --audit-level=low
npm outdated --long
```
