export interface Physician {
  id: string;
  name: string;
  specialty: string;
  bio: string;
  yearsOfExperience: number;
  avatar: string;
}

export interface Booking {
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

export const physicians: Physician[] = [
  {
    id: "1",
    name: "Dr. Sarah Mitchell",
    specialty: "Family Medicine",
    bio: "Compassionate family physician focused on preventive care and chronic disease management.",
    yearsOfExperience: 12,
    avatar: "👩‍⚕️",
  },
  {
    id: "2",
    name: "Dr. James Chen",
    specialty: "Cardiology",
    bio: "Board-certified cardiologist specializing in heart disease prevention and treatment.",
    yearsOfExperience: 18,
    avatar: "👨‍⚕️",
  },
  {
    id: "3",
    name: "Dr. Emily Rodriguez",
    specialty: "Dermatology",
    bio: "Expert in medical and cosmetic dermatology with a focus on skin cancer prevention.",
    yearsOfExperience: 10,
    avatar: "👩‍⚕️",
  },
  {
    id: "4",
    name: "Dr. Michael Thompson",
    specialty: "Pediatrics",
    bio: "Dedicated pediatrician providing comprehensive care for children from infancy through adolescence.",
    yearsOfExperience: 15,
    avatar: "👨‍⚕️",
  },
  {
    id: "5",
    name: "Dr. Lisa Patel",
    specialty: "Orthopedics",
    bio: "Orthopedic surgeon specializing in sports medicine and joint replacement.",
    yearsOfExperience: 14,
    avatar: "👩‍⚕️",
  },
  {
    id: "6",
    name: "Dr. Robert Kim",
    specialty: "Internal Medicine",
    bio: "Internal medicine specialist with expertise in complex medical conditions and geriatric care.",
    yearsOfExperience: 20,
    avatar: "👨‍⚕️",
  },
];

export const initialBookings: Booking[] = [
  {
    id: "B001",
    patientName: "John Smith",
    patientEmail: "john.smith@email.com",
    patientPhone: "(555) 123-4567",
    dateOfBirth: "1985-03-15",
    insurance: "Blue Cross",
    insuranceMemberId: "BC123456789",
    physicianId: "1",
    date: "2026-05-09",
    time: "10:00 AM",
    appointmentType: "In-person",
    reason: "Annual physical examination",
    status: "Confirmed",
    isFirstTime: false,
  },
  {
    id: "B002",
    patientName: "Emma Davis",
    patientEmail: "emma.davis@email.com",
    patientPhone: "(555) 234-5678",
    dateOfBirth: "1992-07-22",
    insurance: "Aetna",
    insuranceMemberId: "AE987654321",
    physicianId: "2",
    date: "2026-05-08",
    time: "2:30 PM",
    appointmentType: "Telehealth",
    reason: "Follow-up consultation for blood pressure management",
    status: "Pending",
    isFirstTime: false,
  },
  {
    id: "B003",
    patientName: "Michael Johnson",
    patientEmail: "michael.j@email.com",
    patientPhone: "(555) 345-6789",
    dateOfBirth: "1978-11-08",
    insurance: "UnitedHealthcare",
    insuranceMemberId: "UH456789123",
    physicianId: "3",
    date: "2026-05-10",
    time: "11:30 AM",
    appointmentType: "In-person",
    reason: "Skin lesion evaluation",
    status: "Pending",
    isFirstTime: true,
  },
  {
    id: "B004",
    patientName: "Sophie Martinez",
    patientEmail: "sophie.m@email.com",
    patientPhone: "(555) 456-7890",
    dateOfBirth: "2018-02-14",
    insurance: "Cigna",
    insuranceMemberId: "CG789123456",
    physicianId: "4",
    date: "2026-05-07",
    time: "3:00 PM",
    appointmentType: "In-person",
    reason: "6-year well-child visit and vaccinations",
    status: "Confirmed",
    isFirstTime: false,
  },
  {
    id: "B005",
    patientName: "David Lee",
    patientEmail: "david.lee@email.com",
    patientPhone: "(555) 567-8901",
    dateOfBirth: "1988-09-30",
    insurance: "Kaiser Permanente",
    insuranceMemberId: "KP321654987",
    physicianId: "5",
    date: "2026-05-12",
    time: "9:00 AM",
    appointmentType: "In-person",
    reason: "Knee pain evaluation - sports injury",
    status: "Pending",
    isFirstTime: false,
  },
  {
    id: "B006",
    patientName: "Margaret Wilson",
    patientEmail: "m.wilson@email.com",
    patientPhone: "(555) 678-9012",
    dateOfBirth: "1955-04-18",
    insurance: "Medicare",
    insuranceMemberId: "MC147258369",
    physicianId: "6",
    date: "2026-05-11",
    time: "1:00 PM",
    appointmentType: "Telehealth",
    reason: "Diabetes management and medication review",
    status: "Confirmed",
    isFirstTime: false,
  },
  {
    id: "B007",
    patientName: "Alex Thompson",
    patientEmail: "alex.t@email.com",
    patientPhone: "(555) 789-0123",
    dateOfBirth: "1995-12-05",
    insurance: "Humana",
    insuranceMemberId: "HM963852741",
    physicianId: "1",
    date: "2026-05-06",
    time: "4:30 PM",
    appointmentType: "In-person",
    reason: "Persistent headaches",
    status: "Cancelled",
    isFirstTime: true,
  },
  {
    id: "B008",
    patientName: "Rachel Green",
    patientEmail: "rachel.green@email.com",
    patientPhone: "(555) 890-1234",
    dateOfBirth: "1990-06-25",
    insurance: "Blue Cross",
    insuranceMemberId: "BC555444333",
    physicianId: "2",
    date: "2026-05-13",
    time: "10:30 AM",
    appointmentType: "Telehealth",
    reason: "Chest pain concerns",
    status: "Pending",
    isFirstTime: false,
  },
];

export const insuranceProviders = [
  "Blue Cross Blue Shield",
  "Aetna",
  "UnitedHealthcare",
  "Cigna",
  "Kaiser Permanente",
  "Humana",
  "Medicare",
  "Medicaid",
  "Other",
];

export const timeSlots = [
  "9:00 AM",
  "9:30 AM",
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
  "1:00 PM",
  "1:30 PM",
  "2:00 PM",
  "2:30 PM",
  "3:00 PM",
  "3:30 PM",
  "4:00 PM",
  "4:30 PM",
];
