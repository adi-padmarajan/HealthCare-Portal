import { z } from "zod";

// ---------------------------------------------------------------------------
// Phone formatting helper — kept here so the schema and the mask share it
// ---------------------------------------------------------------------------

/** Format a raw digit string to (NXX) NXX-XXXX */
export function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6)
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

// ---------------------------------------------------------------------------
// Patient details schema (booking step 3)
// ---------------------------------------------------------------------------

export const patientDetailsSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  dateOfBirth: z
    .string()
    .min(1, "Date of birth is required")
    .refine((v) => {
      const d = new Date(v);
      return !isNaN(d.getTime()) && d < new Date();
    }, "Enter a valid date of birth in the past"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  phone: z
    .string()
    .min(1, "Phone number is required")
    .refine(
      (v) => /^\(\d{3}\) \d{3}-\d{4}$/.test(v),
      "Enter a 10-digit US phone number",
    ),
  insurance: z.string().min(1, "Insurance provider is required"),
  insuranceMemberId: z
    .string()
    .min(1, "Member ID is required")
    .regex(/^[A-Za-z0-9-]+$/, "Member ID must contain only letters, numbers, and hyphens"),
  reason: z
    .string()
    .min(1, "Reason for visit is required")
    .max(500, "Reason must be 500 characters or less"),
  isFirstTime: z.boolean(),
});

export type PatientDetailsFormValues = z.infer<typeof patientDetailsSchema>;

// ---------------------------------------------------------------------------
// Booking creation schema (derived from PatientDetailsFormValues + step data)
// ---------------------------------------------------------------------------

export const createBookingSchema = z.object({
  physicianId: z.string().min(1, "Physician is required"),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  appointmentType: z.enum(["In-person", "Telehealth"]),
  patientName: z.string().min(1),
  patientEmail: z.string().email(),
  patientPhone: z.string(),
  dateOfBirth: z.string(),
  insurance: z.string(),
  insuranceMemberId: z.string(),
  reason: z.string(),
  isFirstTime: z.boolean(),
  status: z.enum(["Pending", "Confirmed", "Cancelled"]),
});

export type CreateBookingFormValues = z.infer<typeof createBookingSchema>;
