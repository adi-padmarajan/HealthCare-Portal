# Custom REST API Contract

Date: 2026-05-07
Decision: target a custom REST backend for Phase 3.
Updated: Phase 4 — auth layer added.

This document describes the API expected by the frontend service layer in
`src/services/api.ts` and mirrored by the MSW handlers in `src/mocks/handlers.ts`.

## Base URL

Configure the frontend with:

```sh
VITE_API_BASE_URL=https://api.example.com/api
```

For local development, MSW handles `/api/*` by default. Set
`VITE_ENABLE_MOCK_API=false` to bypass MSW and call a real backend.

## Transport

- Protocol: HTTPS outside local development.
- Format: JSON request and response bodies.
- Credentials: browser requests use `credentials: "include"` so cookie-backed
  sessions can be supported later.
- Required response header: `Content-Type: application/json` for JSON payloads.

## Authentication

All endpoints except `POST /auth/login` and `POST /auth/signup` that require
authentication must receive a bearer token in the `Authorization` header:

```
Authorization: Bearer <token>
```

The frontend stores the token in-memory via `src/services/authToken.ts`
and injects it automatically in every `fetch` request made through `api.ts`.

### Auth Endpoints

#### `POST /auth/login`

Request body:

```json
{ "email": "patient@example.com", "password": "Demo1234!" }
```

Success `200`:

```json
{ "token": "<bearer-token>", "user": { "id": "...", "email": "...", "name": "...", "role": "patient" } }
```

Failure `401` with code `INVALID_CREDENTIALS`.

#### `POST /auth/signup`

Request body:

```json
{ "name": "Jane Doe", "email": "jane@example.com", "password": "...", "confirmPassword": "..." }
```

Success `201` — same shape as login response. New accounts always get role `patient`.

Failure `409` with code `CONFLICT` if email is already registered.

#### `POST /auth/logout`

No body. Returns `204 No Content`. The frontend discards its in-memory token.

### Role Restrictions

| Endpoint | `patient` | `admin` |
|---|---|---|
| `GET /physicians` | ✅ public | ✅ public |
| `POST /physicians` | ❌ | ✅ |
| `GET /availability` | ✅ public | ✅ public |
| `GET /bookings` | ✅ scoped to own email | ✅ all |
| `POST /bookings` | ✅ own email only | ✅ |
| `PATCH /bookings/:id/status` | ✅ cancel own only | ✅ any status |
| `DELETE /bookings/:id` | ❌ | ✅ |
| `GET /patients` | ❌ | ✅ |
| `GET /patients/:id` | ❌ | ✅ |
| `GET /patients/:id/bookings` | ❌ | ✅ |

Unauthenticated requests to protected endpoints return `401 UNAUTHORIZED`.
Authenticated requests without the required role return `403 FORBIDDEN`.

## Error Shape

All non-2xx responses should return a sanitized error body:

```json
{
  "code": "DOUBLE_BOOKED",
  "message": "The selected appointment time is no longer available.",
  "details": {}
}
```

Do not include PHI in `message`, `code`, or `details`.

Expected status codes:

- `400` for malformed input.
- `401` for unauthenticated requests.
- `403` for authenticated users without permission.
- `404` for missing records.
- `409` for booking conflicts such as double booking, or duplicate email on signup.
- `422` for validation failures.
- `500` for sanitized server errors.

## Resources

### Physician

```ts
interface Physician {
  id: string;
  name: string;
  specialty: string;
  bio: string;
  yearsOfExperience: number;
  avatar: string;
}
```

Endpoints:

- `GET /physicians` -> `Physician[]`
- `POST /physicians` with `Omit<Physician, "id">` -> `Physician`
- `GET /physicians/:id` -> `Physician`
- `PATCH /physicians/:id` with partial physician fields -> `Physician`
- `DELETE /physicians/:id` -> `204 No Content`

### Availability

```ts
interface AvailabilitySlot {
  id: string;
  physicianId: string;
  date: string;
  time: string;
  status: "Available" | "Unavailable";
}
```

Endpoints:

- `GET /availability?physicianId=:id&date=:yyyy-mm-dd&appointmentType=:type`
  -> `AvailabilitySlot[]`
- `POST /availability` with `Omit<AvailabilitySlot, "id">`
  -> `AvailabilitySlot`
- `PATCH /availability/:id` with partial availability fields
  -> `AvailabilitySlot`
- `DELETE /availability/:id` -> `204 No Content`

Backend requirements:

- Availability must account for existing non-cancelled bookings.
- Appointment creation must re-check availability at submission time.
- `appointmentType` is included now so in-person and telehealth schedules can
  diverge later.

### Booking

```ts
interface Booking {
  id: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  dateOfBirth: string;
  insurance: string;
  insuranceMemberId: string;
  physicianId: string;
  date: string;
  time: string;
  appointmentType: "In-person" | "Telehealth";
  reason: string;
  status: "Pending" | "Confirmed" | "Cancelled";
  isFirstTime: boolean;
}
```

Endpoints:

- `GET /bookings` -> `Booking[]`
- `GET /bookings?patientEmail=:email` -> bookings for one patient
- `GET /bookings?physicianId=:id&date=:yyyy-mm-dd` -> filtered bookings
- `GET /bookings?status=Pending` -> filtered bookings
- `POST /bookings` with `Omit<Booking, "id">` -> `Booking`
- `GET /bookings/:id` -> `Booking`
- `PATCH /bookings/:id` with partial booking fields -> `Booking`
- `PATCH /bookings/:id/status` with `{ "status": "Confirmed" }` -> `Booking`
- `DELETE /bookings/:id` -> `204 No Content`

Conflict behavior:

- If a non-cancelled booking already exists for the same physician, date, and
  time, `POST /bookings` must return `409` with code `DOUBLE_BOOKED`.
- Clients should treat the response as authoritative and refetch availability.

### Patient

```ts
interface Patient {
  id: string;
  fullName: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  insuranceProvider: string;
  insuranceMemberId: string;
}
```

Endpoints:

- `GET /patients` -> `Patient[]`
- `POST /patients` with `Omit<Patient, "id">` -> `Patient`
- `GET /patients/:id` -> `Patient`
- `PATCH /patients/:id` with partial patient fields -> `Patient`
- `DELETE /patients/:id` -> `204 No Content`
- `GET /patients/:id/bookings` -> `Booking[]`

Authorization rules match the Role Restrictions table above.

## PHI Handling Requirements

- Do not put PHI in URLs beyond unavoidable identifiers or query filters agreed
  by the backend team. Prefer opaque patient ids once auth is implemented.
- Do not log request or response bodies containing patient data.
- Sanitize server error messages before returning them to the frontend.
- Avoid returning more patient fields than a view requires.
- Add audit logging for admin status changes in Phase 6.

## Local Mock Coverage

MSW currently implements:

- Auth: `POST /auth/login`, `POST /auth/signup`, `POST /auth/logout`.
- Physicians CRUD.
- Availability list/create/update/delete.
- Bookings list/create/get/update/status/delete with 401/403 enforcement.
- Patients list/create/get/update/delete and patient booking lookup (admin only).
- A `409 DOUBLE_BOOKED` response for conflicting booking creation.

The mock layer is not a security boundary. It exists only to keep frontend
development unblocked until the real custom REST backend is available.
