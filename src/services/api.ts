import { authToken } from "@/services/authToken";
import type {
  AppointmentType,
  AuditLogEntry,
  AvailabilitySlot,
  Booking,
  BookingId,
  BookingStatus,
  CreateBookingInput,
  ISODateString,
  MutableBookingStatus,
  Patient,
  PatientId,
  Physician,
  PhysicianId,
} from "@/types";

type QueryValue = string | number | boolean | undefined | null;

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  query?: Record<string, QueryValue>;
}

export interface BookingFilters extends Record<string, QueryValue> {
  date?: ISODateString;
  patientEmail?: string;
  physicianId?: PhysicianId;
  status?: BookingStatus;
}

export interface AvailabilityFilters extends Record<string, QueryValue> {
  appointmentType?: AppointmentType;
  date?: ISODateString;
  physicianId: PhysicianId;
}

export interface BookingStatusUpdateInput {
  status: MutableBookingStatus;
}

export type CreatePhysicianInput = Omit<Physician, "id">;
export type UpdatePhysicianInput = Partial<CreatePhysicianInput>;

export type CreateAvailabilitySlotInput = Omit<AvailabilitySlot, "id">;
export type UpdateAvailabilitySlotInput = Partial<CreateAvailabilitySlotInput>;

export type CreatePatientInput = Omit<Patient, "id">;
export type UpdatePatientInput = Partial<CreatePatientInput>;

export class ApiError extends Error {
  readonly code?: string;
  readonly details?: unknown;
  readonly status: number;

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

function buildUrl(path: string, query?: Record<string, QueryValue>) {
  const url = new URL(`${API_BASE_URL}${path}`, window.location.origin);

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

async function parseError(response: Response) {
  const fallbackMessage = "The request could not be completed.";

  try {
    const payload = (await response.json()) as {
      code?: string;
      details?: unknown;
      message?: string;
    };

    return new ApiError(
      payload.message ?? fallbackMessage,
      response.status,
      payload.code,
      payload.details,
    );
  } catch {
    return new ApiError(fallbackMessage, response.status);
  }
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, query, ...init } = options;
  const token = authToken.get();
  const response = await fetch(buildUrl(path, query), {
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...init,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

function remove(path: string) {
  return request<void>(path, { method: "DELETE" });
}

export const api = {
  auditLog: {
    list(signal?: AbortSignal) {
      return request<AuditLogEntry[]>("/audit-log", { signal });
    },
  },
  availability: {
    create(input: CreateAvailabilitySlotInput, signal?: AbortSignal) {
      return request<AvailabilitySlot>("/availability", { body: input, method: "POST", signal });
    },
    delete(id: string, signal?: AbortSignal) {
      return remove(`/availability/${encodeURIComponent(id)}`);
    },
    list(filters: AvailabilityFilters, signal?: AbortSignal) {
      return request<AvailabilitySlot[]>("/availability", { query: filters, signal });
    },
    update(id: string, input: UpdateAvailabilitySlotInput, signal?: AbortSignal) {
      return request<AvailabilitySlot>(`/availability/${encodeURIComponent(id)}`, {
        body: input,
        method: "PATCH",
        signal,
      });
    },
  },
  bookings: {
    cancel(id: BookingId, signal?: AbortSignal) {
      return request<Booking>(`/bookings/${encodeURIComponent(id)}/status`, {
        body: { status: "Cancelled" satisfies MutableBookingStatus },
        method: "PATCH",
        signal,
      });
    },
    create(input: CreateBookingInput, signal?: AbortSignal) {
      return request<Booking>("/bookings", { body: input, method: "POST", signal });
    },
    delete(id: BookingId, signal?: AbortSignal) {
      return remove(`/bookings/${encodeURIComponent(id)}`);
    },
    get(id: BookingId, signal?: AbortSignal) {
      return request<Booking>(`/bookings/${encodeURIComponent(id)}`, { signal });
    },
    list(filters: BookingFilters = {}, signal?: AbortSignal) {
      return request<Booking[]>("/bookings", { query: filters, signal });
    },
    update(id: BookingId, input: Partial<CreateBookingInput>, signal?: AbortSignal) {
      return request<Booking>(`/bookings/${encodeURIComponent(id)}`, {
        body: input,
        method: "PATCH",
        signal,
      });
    },
    updateStatus(id: BookingId, input: BookingStatusUpdateInput, signal?: AbortSignal) {
      return request<Booking>(`/bookings/${encodeURIComponent(id)}/status`, {
        body: input,
        method: "PATCH",
        signal,
      });
    },
  },
  patients: {
    create(input: CreatePatientInput, signal?: AbortSignal) {
      return request<Patient>("/patients", { body: input, method: "POST", signal });
    },
    delete(id: PatientId, signal?: AbortSignal) {
      return remove(`/patients/${encodeURIComponent(id)}`);
    },
    get(id: PatientId, signal?: AbortSignal) {
      return request<Patient>(`/patients/${encodeURIComponent(id)}`, { signal });
    },
    list(signal?: AbortSignal) {
      return request<Patient[]>("/patients", { signal });
    },
    listBookings(id: PatientId, signal?: AbortSignal) {
      return request<Booking[]>(`/patients/${encodeURIComponent(id)}/bookings`, { signal });
    },
    update(id: PatientId, input: UpdatePatientInput, signal?: AbortSignal) {
      return request<Patient>(`/patients/${encodeURIComponent(id)}`, {
        body: input,
        method: "PATCH",
        signal,
      });
    },
  },
  physicians: {
    create(input: CreatePhysicianInput, signal?: AbortSignal) {
      return request<Physician>("/physicians", { body: input, method: "POST", signal });
    },
    delete(id: PhysicianId, signal?: AbortSignal) {
      return remove(`/physicians/${encodeURIComponent(id)}`);
    },
    get(id: PhysicianId, signal?: AbortSignal) {
      return request<Physician>(`/physicians/${encodeURIComponent(id)}`, { signal });
    },
    list(signal?: AbortSignal) {
      return request<Physician[]>("/physicians", { signal });
    },
    update(id: PhysicianId, input: UpdatePhysicianInput, signal?: AbortSignal) {
      return request<Physician>(`/physicians/${encodeURIComponent(id)}`, {
        body: input,
        method: "PATCH",
        signal,
      });
    },
  },
};
