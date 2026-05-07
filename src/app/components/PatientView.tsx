import { useState } from "react";
import { ProgressSteps } from "../components/ui/progress-steps";
import { StepPhysician } from "./booking/StepPhysician";
import { StepDateTime } from "./booking/StepDateTime";
import { StepPatientDetails } from "./booking/StepPatientDetails";
import { StepReview } from "./booking/StepReview";
import { BookingConfirmation } from "./booking/BookingConfirmation";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { physicians } from "../data/mockData";
import { format } from "date-fns";
import { Calendar, Clock, User, X } from "lucide-react";
import type { AppointmentType, Booking, CreateBookingInput, PatientDetails } from "@/types";

const steps = ["Choose Physician", "Select Time", "Patient Details", "Review"];

interface PatientViewProps {
  bookings: Booking[];
  onAddBooking: (booking: CreateBookingInput) => void;
  onCancelBooking: (bookingId: string) => void;
}

export function PatientView({ bookings, onAddBooking, onCancelBooking }: PatientViewProps) {
  const [view, setView] = useState<"booking" | "my-appointments" | "confirmed">("booking");
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedPhysician, setSelectedPhysician] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState("");
  const [appointmentType, setAppointmentType] = useState<AppointmentType>("In-person");
  const [patientDetails, setPatientDetails] = useState<PatientDetails>({
    fullName: "",
    dateOfBirth: "",
    email: "",
    phone: "",
    insurance: "",
    insuranceMemberId: "",
    reason: "",
    isFirstTime: false,
  });
  const [lastBookingId, setLastBookingId] = useState("");

  const handlePhysicianSelect = (physicianId: string) => {
    setSelectedPhysician(physicianId);
    setCurrentStep(1);
  };

  const handleConfirmBooking = () => {
    const bookingId = `B${String(Math.floor(Math.random() * 9000) + 1000)}`;
    onAddBooking({
      patientName: patientDetails.fullName,
      patientEmail: patientDetails.email,
      patientPhone: patientDetails.phone,
      dateOfBirth: patientDetails.dateOfBirth,
      insurance: patientDetails.insurance,
      insuranceMemberId: patientDetails.insuranceMemberId,
      physicianId: selectedPhysician,
      date: selectedDate ? format(selectedDate, "yyyy-MM-dd") : "",
      time: selectedTime,
      appointmentType,
      reason: patientDetails.reason,
      status: "Pending",
      isFirstTime: patientDetails.isFirstTime,
    });
    setLastBookingId(bookingId);
    setView("confirmed");
  };

  const handleNewBooking = () => {
    setView("booking");
    setCurrentStep(0);
    setSelectedPhysician("");
    setSelectedDate(undefined);
    setSelectedTime("");
    setAppointmentType("In-person");
    setPatientDetails({
      fullName: "",
      dateOfBirth: "",
      email: "",
      phone: "",
      insurance: "",
      insuranceMemberId: "",
      reason: "",
      isFirstTime: false,
    });
  };

  if (view === "confirmed") {
    return (
      <BookingConfirmation
        bookingId={lastBookingId}
        onViewAppointments={() => setView("my-appointments")}
        onNewBooking={handleNewBooking}
      />
    );
  }

  if (view === "my-appointments") {
    const myBookings = bookings.filter((b) => b.patientEmail === patientDetails.email || bookings.length > 0);

    return (
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1>My Appointments</h1>
            <p className="text-muted-foreground">View and manage your upcoming appointments</p>
          </div>
          <Button onClick={() => setView("booking")}>Book New Appointment</Button>
        </div>

        {myBookings.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="mb-2">No Appointments Yet</h3>
              <p className="text-muted-foreground mb-6">You haven't booked any appointments</p>
              <Button onClick={() => setView("booking")}>Book Your First Appointment</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {myBookings.map((booking) => {
              const physician = physicians.find((p) => p.id === booking.physicianId);
              return (
                <Card key={booking.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="text-3xl">{physician?.avatar || "👨‍⚕️"}</div>
                        <div className="space-y-2">
                          <div>
                            <h3>{physician?.name}</h3>
                            <p className="text-sm text-muted-foreground">{physician?.specialty}</p>
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span>{format(new Date(booking.date), "MMM d, yyyy")}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span>{booking.time}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span>{booking.appointmentType}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={booking.status.toLowerCase() as "pending" | "confirmed" | "cancelled"}>
                          {booking.status}
                        </Badge>
                        {booking.status !== "Cancelled" && (
                          <Button variant="ghost" size="sm" onClick={() => onCancelBooking(booking.id)}>
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="mb-2">Book an Appointment</h1>
        <p className="text-muted-foreground">Schedule your visit with our healthcare professionals</p>
      </div>

      <Card className="mb-8">
        <CardContent className="p-6">
          <ProgressSteps steps={steps} currentStep={currentStep} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          {currentStep === 0 && <StepPhysician onSelect={handlePhysicianSelect} />}
          {currentStep === 1 && (
            <StepDateTime
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              appointmentType={appointmentType}
              onDateChange={setSelectedDate}
              onTimeChange={setSelectedTime}
              onAppointmentTypeChange={setAppointmentType}
              onNext={() => setCurrentStep(2)}
              onBack={() => setCurrentStep(0)}
            />
          )}
          {currentStep === 2 && (
            <StepPatientDetails
              details={patientDetails}
              onChange={setPatientDetails}
              onNext={() => setCurrentStep(3)}
              onBack={() => setCurrentStep(1)}
            />
          )}
          {currentStep === 3 && (
            <StepReview
              physicianId={selectedPhysician}
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              appointmentType={appointmentType}
              patientDetails={patientDetails}
              onBack={() => setCurrentStep(2)}
              onConfirm={handleConfirmBooking}
            />
          )}
        </CardContent>
      </Card>

      {currentStep > 0 && view === "booking" && (
        <div className="mt-4 text-center">
          <Button variant="ghost" onClick={() => setView("my-appointments")}>
            View My Appointments
          </Button>
        </div>
      )}
    </div>
  );
}
