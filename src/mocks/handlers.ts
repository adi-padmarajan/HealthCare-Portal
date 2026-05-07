import { delay, http, HttpResponse } from "msw";

import { initialBookings, physicians as initialPhysicians, timeSlots } from "@/services/mockData";
import type {
  AvailabilitySlot,
  Booking,
  BookingStatus,
  CreateBookingInput,
  Patient,
  Physician,
} from "@/types";

const API_BASE = "*/api";
const NETWORK_DELAY_MS = 250;

let physicians: Physician[] = structuredClone(initialPhysicians);
let bookings: Booking[] = structuredClone(initialBookings);
let availabilityOverrides: AvailabilitySlot[] = [];

function nextId(prefix: string) {
  return `${prefix}${String(Math.floor(Math.random() * 9000) + 1000)}`;
}

function notFound(resource: string) {
  return HttpResponse.json(
    {
      code: "NOT_FOUND",
      message: `${resource} was not found.`,
    },
    { status: 404 },
  );
}

function badRequest(message: string) {
  return HttpResponse.json(
    {
      code: "BAD_REQUEST",
      message,
    },
    { status: 400 },
  );
}

function patientIdFromEmail(email: string) {
  return `P-${email.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

function patientFromBooking(booking: Booking): Patient {
  return {
    dateOfBirth: booking.dateOfBirth,
    email: booking.patientEmail,
    fullName: booking.patientName,
    id: patientIdFromEmail(booking.patientEmail),
    insuranceMemberId: booking.insuranceMemberId,
    insuranceProvider: booking.insurance,
    phone: booking.patientPhone,
  };
}

function listPatients() {
  const byId = new Map<string, Patient>();

  for (const booking of bookings) {
    const patient = patientFromBooking(booking);
    byId.set(patient.id, patient);
  }

  return Array.from(byId.values());
}

function getRequestId(params: Record<string, string | readonly string[] | undefined>) {
  const value = params.id;
  return Array.isArray(value) ? value[0] : value;
}

async function readBody<T>(request: Request) {
  return (await request.json()) as T;
}

function buildAvailability(physicianId: string, date: string): AvailabilitySlot[] {
  return timeSlots.map((time) => {
    const override = availabilityOverrides.find(
      (slot) => slot.physicianId === physicianId && slot.date === date && slot.time === time,
    );
    const booked = bookings.some(
      (booking) =>
        booking.physicianId === physicianId &&
        booking.date === date &&
        booking.time === time &&
        booking.status !== "Cancelled",
    );
    const isStaticUnavailable = time === "9:30 AM" || time === "2:00 PM";

    return {
      date,
      id: `${physicianId}-${date}-${time.replace(/[^a-z0-9]/gi, "")}`,
      physicianId,
      status: override?.status ?? (booked || isStaticUnavailable ? "Unavailable" : "Available"),
      time,
    };
  });
}

function filterBookings(url: URL) {
  const date = url.searchParams.get("date");
  const patientEmail = url.searchParams.get("patientEmail");
  const physicianId = url.searchParams.get("physicianId");
  const status = url.searchParams.get("status") as BookingStatus | null;

  return bookings.filter((booking) => {
    const matchesDate = !date || booking.date === date;
    const matchesPatient = !patientEmail || booking.patientEmail === patientEmail;
    const matchesPhysician = !physicianId || booking.physicianId === physicianId;
    const matchesStatus = !status || booking.status === status;

    return matchesDate && matchesPatient && matchesPhysician && matchesStatus;
  });
}

async function withDelay<T>(response: T) {
  await delay(NETWORK_DELAY_MS);
  return response;
}

export const handlers = [
  http.get(`${API_BASE}/physicians`, async () => withDelay(HttpResponse.json(physicians))),
  http.post(`${API_BASE}/physicians`, async ({ request }) => {
    const input = await readBody<Omit<Physician, "id">>(request);
    const physician: Physician = { ...input, id: nextId("PHY-") };
    physicians = [...physicians, physician];
    return withDelay(HttpResponse.json(physician, { status: 201 }));
  }),
  http.get(`${API_BASE}/physicians/:id`, async ({ params }) => {
    const id = getRequestId(params);
    const physician = physicians.find((item) => item.id === id);
    return withDelay(physician ? HttpResponse.json(physician) : notFound("Physician"));
  }),
  http.patch(`${API_BASE}/physicians/:id`, async ({ params, request }) => {
    const id = getRequestId(params);
    const input = await readBody<Partial<Omit<Physician, "id">>>(request);
    const physician = physicians.find((item) => item.id === id);

    if (!physician) {
      return withDelay(notFound("Physician"));
    }

    const updated = { ...physician, ...input };
    physicians = physicians.map((item) => (item.id === id ? updated : item));
    return withDelay(HttpResponse.json(updated));
  }),
  http.delete(`${API_BASE}/physicians/:id`, async ({ params }) => {
    const id = getRequestId(params);
    physicians = physicians.filter((item) => item.id !== id);
    return withDelay(new HttpResponse(null, { status: 204 }));
  }),

  http.get(`${API_BASE}/availability`, async ({ request }) => {
    const url = new URL(request.url);
    const physicianId = url.searchParams.get("physicianId");
    const date = url.searchParams.get("date");

    if (!physicianId || !date) {
      return withDelay(badRequest("physicianId and date are required."));
    }

    return withDelay(HttpResponse.json(buildAvailability(physicianId, date)));
  }),
  http.post(`${API_BASE}/availability`, async ({ request }) => {
    const input = await readBody<Omit<AvailabilitySlot, "id">>(request);
    const slot: AvailabilitySlot = { ...input, id: nextId("AVL-") };
    availabilityOverrides = [...availabilityOverrides, slot];
    return withDelay(HttpResponse.json(slot, { status: 201 }));
  }),
  http.patch(`${API_BASE}/availability/:id`, async ({ params, request }) => {
    const id = getRequestId(params);
    const input = await readBody<Partial<Omit<AvailabilitySlot, "id">>>(request);
    const slot = availabilityOverrides.find((item) => item.id === id);

    if (!slot) {
      return withDelay(notFound("Availability slot"));
    }

    const updated = { ...slot, ...input };
    availabilityOverrides = availabilityOverrides.map((item) => (item.id === id ? updated : item));
    return withDelay(HttpResponse.json(updated));
  }),
  http.delete(`${API_BASE}/availability/:id`, async ({ params }) => {
    const id = getRequestId(params);
    availabilityOverrides = availabilityOverrides.filter((item) => item.id !== id);
    return withDelay(new HttpResponse(null, { status: 204 }));
  }),

  http.get(`${API_BASE}/bookings`, async ({ request }) => {
    const url = new URL(request.url);
    return withDelay(HttpResponse.json(filterBookings(url)));
  }),
  http.post(`${API_BASE}/bookings`, async ({ request }) => {
    const input = await readBody<CreateBookingInput>(request);
    const isDoubleBooked = bookings.some(
      (booking) =>
        booking.physicianId === input.physicianId &&
        booking.date === input.date &&
        booking.time === input.time &&
        booking.status !== "Cancelled",
    );

    if (isDoubleBooked) {
      return withDelay(
        HttpResponse.json(
          {
            code: "DOUBLE_BOOKED",
            message: "The selected appointment time is no longer available.",
          },
          { status: 409 },
        ),
      );
    }

    const booking: Booking = { ...input, id: nextId("B") };
    bookings = [...bookings, booking];
    return withDelay(HttpResponse.json(booking, { status: 201 }));
  }),
  http.get(`${API_BASE}/bookings/:id`, async ({ params }) => {
    const id = getRequestId(params);
    const booking = bookings.find((item) => item.id === id);
    return withDelay(booking ? HttpResponse.json(booking) : notFound("Booking"));
  }),
  http.patch(`${API_BASE}/bookings/:id`, async ({ params, request }) => {
    const id = getRequestId(params);
    const input = await readBody<Partial<CreateBookingInput>>(request);
    const booking = bookings.find((item) => item.id === id);

    if (!booking) {
      return withDelay(notFound("Booking"));
    }

    const updated = { ...booking, ...input };
    bookings = bookings.map((item) => (item.id === id ? updated : item));
    return withDelay(HttpResponse.json(updated));
  }),
  http.patch(`${API_BASE}/bookings/:id/status`, async ({ params, request }) => {
    const id = getRequestId(params);
    const input = await readBody<{ status: BookingStatus }>(request);
    const booking = bookings.find((item) => item.id === id);

    if (!booking) {
      return withDelay(notFound("Booking"));
    }

    const updated = { ...booking, status: input.status };
    bookings = bookings.map((item) => (item.id === id ? updated : item));
    return withDelay(HttpResponse.json(updated));
  }),
  http.delete(`${API_BASE}/bookings/:id`, async ({ params }) => {
    const id = getRequestId(params);
    bookings = bookings.filter((item) => item.id !== id);
    return withDelay(new HttpResponse(null, { status: 204 }));
  }),

  http.get(`${API_BASE}/patients`, async () => withDelay(HttpResponse.json(listPatients()))),
  http.post(`${API_BASE}/patients`, async ({ request }) => {
    const input = await readBody<Omit<Patient, "id">>(request);
    const patient: Patient = { ...input, id: patientIdFromEmail(input.email) };
    return withDelay(HttpResponse.json(patient, { status: 201 }));
  }),
  http.get(`${API_BASE}/patients/:id`, async ({ params }) => {
    const id = getRequestId(params);
    const patient = listPatients().find((item) => item.id === id);
    return withDelay(patient ? HttpResponse.json(patient) : notFound("Patient"));
  }),
  http.patch(`${API_BASE}/patients/:id`, async ({ params, request }) => {
    const id = getRequestId(params);
    const input = await readBody<Partial<Omit<Patient, "id">>>(request);
    const patient = listPatients().find((item) => item.id === id);

    if (!patient) {
      return withDelay(notFound("Patient"));
    }

    return withDelay(HttpResponse.json({ ...patient, ...input }));
  }),
  http.delete(`${API_BASE}/patients/:id`, async () => withDelay(new HttpResponse(null, { status: 204 }))),
  http.get(`${API_BASE}/patients/:id/bookings`, async ({ params }) => {
    const id = getRequestId(params);
    const patient = listPatients().find((item) => item.id === id);

    if (!patient) {
      return withDelay(notFound("Patient"));
    }

    return withDelay(HttpResponse.json(bookings.filter((booking) => booking.patientEmail === patient.email)));
  }),
];
