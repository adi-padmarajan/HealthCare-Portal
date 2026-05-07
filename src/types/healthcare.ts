export type EntityId = string;
export type PhysicianId = EntityId;
export type PatientId = EntityId;
export type BookingId = EntityId;
export type ISODateString = string;
export type TimeSlotLabel = string;

export type UserRole = "patient" | "admin";
export type AppointmentType = "In-person" | "Telehealth";
export type BookingStatus = "Pending" | "Confirmed" | "Cancelled";
export type AvailabilityStatus = "Available" | "Unavailable";

export interface Physician {
  id: PhysicianId;
  name: string;
  specialty: string;
  bio: string;
  yearsOfExperience: number;
  avatar: string;
}

export interface Patient {
  id: PatientId;
  fullName: string;
  dateOfBirth: ISODateString;
  email: string;
  phone: string;
  insuranceProvider: string;
  insuranceMemberId: string;
}

export interface PatientDetails {
  fullName: string;
  dateOfBirth: ISODateString;
  email: string;
  phone: string;
  insurance: string;
  insuranceMemberId: string;
  reason: string;
  isFirstTime: boolean;
}

export interface Booking {
  id: BookingId;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  dateOfBirth: ISODateString;
  insurance: string;
  insuranceMemberId: string;
  physicianId: PhysicianId;
  date: ISODateString;
  time: TimeSlotLabel;
  appointmentType: AppointmentType;
  reason: string;
  status: BookingStatus;
  isFirstTime: boolean;
}

export type CreateBookingInput = Omit<Booking, "id">;
export type MutableBookingStatus = Extract<BookingStatus, "Confirmed" | "Cancelled">;

export interface Appointment {
  id: BookingId;
  patientId: PatientId;
  physicianId: PhysicianId;
  startsAt: string;
  appointmentType: AppointmentType;
  reason: string;
  status: BookingStatus;
  isFirstTime: boolean;
}

export interface AvailabilitySlot {
  physicianId: PhysicianId;
  date: ISODateString;
  time: TimeSlotLabel;
  status: AvailabilityStatus;
}

export interface AuditLogEntry {
  id: EntityId;
  actorId: EntityId;
  action: string;
  targetId: EntityId;
  timestamp: string;
  metadata?: Record<string, string | number | boolean | null>;
}
