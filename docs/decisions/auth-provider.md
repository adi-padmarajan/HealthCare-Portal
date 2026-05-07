# ADR-001: Auth Provider Selection

Date: 2026-05-07
Status: Accepted
Branch: `production-hardening`

## Context

The HealthCare Portal handles protected health information (PHI) and requires
role-based access control separating patients from admin/physician users. An
auth solution is needed that:

- Supports two roles: `patient` and `admin`
- Is compatible with the existing cookie-based fetch layer
  (`credentials: "include"` in `src/services/api.ts`)
- Provides a BAA for HIPAA compliance when deployed to production
- Does not require a live backend or API keys during frontend development
- Aligns with the React + TanStack Query stack established in Phases 2–3

Alternatives evaluated:

| Provider       | Key tradeoff                                                    |
| -------------- | --------------------------------------------------------------- |
| **Clerk**      | React-first SDK; BAA available; cookie sessions; free 10k MAU  |
| Auth0          | Redirects to hosted domain on free tier, breaking single-page flow |
| Supabase Auth  | Natural pairing if Supabase is chosen as the backend DB; stores sessions in `localStorage` by default (PHI risk) |
| Custom JWT     | Full control but requires building issuance, rotation, storage — scope exceeds Phase 4 |

## Decision

**Clerk** — scaffolded as a mock-only implementation for Phase 4.

Clerk is adopted as the target provider. Live credentials are deferred until a
backend and deployment environment are confirmed. The Phase 4 implementation
uses an in-memory mock that exposes the same hook surface as the Clerk React
SDK (`useAuth`, `useCurrentUser`, `useIsAdmin`). Connecting the real SDK later
requires only replacing the context provider and deleting the mock layer —
every consumer file stays unchanged.

The mock token is a base64-encoded JSON payload prefixed with `mock.`. It is
intentionally not cryptographically signed and must never ship to production.
MSW handlers decode this token to enforce 401/403 access control in
development.

## Consequences

**Positive:**

- No live API keys or external network calls required during local development
- Hook surface mirrors the Clerk React SDK — production integration is a
  provider swap, not a consumer refactor
- BAA available from Clerk for HIPAA workloads
- Free tier covers up to 10 000 MAU; upgrade path is clear
- In-memory session avoids PHI leaking into `localStorage` or `sessionStorage`
  (aligns with the PHI hardening work planned for Phase 6)

**Negative / risks:**

- Mock token is not cryptographically signed; MSW must never run in production
- Refreshing the browser tab logs the user out during development (acceptable
  for scaffolding; addressed when real Clerk is integrated)
- Admin credentials (`admin@example.com`) are seeded in source — acceptable for
  mock-only, but must be removed before any production build

## Migration path (when ready for production)

1. Create a Clerk application at clerk.com and obtain the publishable key.
2. `npm install @clerk/clerk-react`
3. Set `VITE_CLERK_PUBLISHABLE_KEY` in `.env`.
4. Replace `<AuthProvider>` in `src/main.tsx` with `<ClerkProvider publishableKey={...}>`.
5. Replace the mock hooks in `src/features/auth/hooks.ts` with Clerk's
   `useAuth` and `useUser`.
6. Remove `src/features/auth/mock-auth.ts` and the mock-token helpers from
   `src/services/authToken.ts`.
7. Remove the `/api/auth/*` MSW handlers added in Phase 4.

## Related

- Phase 6 (PHI hardening) will audit session storage and ensure no PHI leaks
  through the auth layer.
- `docs/api/README.md` — updated in Phase 4 to document auth headers and
  role-based endpoint restrictions.
- `src/features/auth/` — implementation of this decision.
