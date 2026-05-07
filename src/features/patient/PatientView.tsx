import { useState } from "react";
import { toast } from "sonner";

import { EmptyState, ErrorState, LoadingState } from "@/components/async-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProgressSteps } from "@/components/ui/progress-steps";
import { useCurrentUser } from "@/features/auth";
import {
  BookingConfirmation,
  StepDateTime,
  StepPatientDetails,
  StepPhysician,
  StepReview,
} from "@/features/booking";
import { useBookings, useCancelBooking, useCreateBooking, usePhysicians } from "@/services/queries";
import { format } from "date-fns";
import { Calendar, Clock, User, X } from "lucide-react";
import type { AppointmentType, PatientDetails } from "@/types";

const steps = ["Choose Physician", "Select Time", "Patient Details", "Review"];

export function PatientView() {
  const currentUser = useCurrentUser();
  const [view, setView] = useState<"booking" | "my-appointments" | "confirmed">("booking");
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedPhysician, setSelectedPhysician] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState("");
  const [appointmentType, setAppointmentType] = useState<AppointmentType>("In-person");
  // Pre-populate from auth so the patient doesn't retype known fields.
  const [patientDetails, setPatientDetails] = useState<PatientDetails>(() => ({
    fullName: currentUser?.name ?? "",
    dateOfBirth: "",
    email: currentUser?.email ?? "",
    phone: "",
    insurance: "",
    insuranceMemberId: "",
    reason: "",
    isFirstTime: false,
  }));
  const [lastBookingId, setLastBookingId] = useState("");
  const physiciansQuery = usePhysicians();
  const createBooking = useCreateBooking();
  const cancelBooking = useCancelBooking();
  // Always scope "my appointments" to the authenticated user's email,
  // not the value entered in the booking form — prevents data leakage.
  const patientEmail = currentUser?.email ?? "";
  const myBookingsQuery = useBookings(
    patientEmail ? { patientEmail } : {},
    view === "my-appointments" && patientEmail.length > 0,
  );
  const physicians = physiciansQuery.data ?? [];

  const handlePhysicianSelect = (physicianId: string) => {
    setSelectedPhysician(physicianId);
    setCurrentStep(1);
  };

  const handleConfirmBooking = async () => {
    try {
      const booking = await createBooking.mutateAsync({
        appointmentType,
        date: selectedDate ? format(selectedDate, "yyyy-MM-dd") : "",
        dateOfBirth: patientDetails.dateOfBirth,
        insurance: patientDetails.insurance,
        insuranceMemberId: patientDetails.insuranceMemberId,
        isFirstTime: patientDetails.isFirstTime,
        patientEmail: patientDetails.email,
        patientName: patientDetails.fullName,
        patientPhone: patientDetails.phone,
        physicianId: selectedPhysician,
        reason: patientDetails.reason,
        status: "Pending",
        time: selectedTime,
      });

      setLastBookingId(booking.id);
      toast.success("Appointment request submitted", {
        description: "The appointment is pending office confirmation.",
      });
      setView("confirmed");
    } catch {
      toast.error("Unable to submit appointment request", {
        description: "Please try again. No appointment details were included in this error.",
      });
    }
  };

  const handleCancelBooking = (bookingId: string) => {
    cancelBooking.mutate(bookingId, {
      onError: () => {
        toast.error("Unable to cancel appointment", {
          description: "Please try again. No appointment details were included in this error.",
        });
      },
      onSuccess: () => {
        toast.info("Appointment cancelled");
      },
    });
  };

  const handleNewBooking = () => {
    setView("booking");
    setCurrentStep(0);
    setSelectedPhysician("");
    setSelectedDate(undefined);
    setSelectedTime("");
    setAppointmentType("In-person");
    setPatientDetails({
      fullName: currentUser?.name ?? "",
      dateOfBirth: "",
      email: currentUser?.email ?? "",
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
    const myBookings = myBookingsQuery.data ?? [];

    return (
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1>My Appointments</h1>
            <p className="text-muted-foreground">View and manage your upcoming appointments</p>
          </div>
          <Button onClick={() => setView("booking")}>Book New Appointment</Button>
        </div>

        {!patientEmail ? (
          <EmptyState
            title="No patient lookup selected"
            description="Book an appointment first so this view can load the current patient's appointments."
            action={<Button onClick={() => setView("booking")}>Book Appointment</Button>}
          />
        ) : myBookingsQuery.isLoading ? (
          <LoadingState message="Loading appointments..." />
        ) : myBookingsQuery.isError ? (
          <ErrorState
            title="Unable to load appointments"
            message="Please try again. Appointment details are not shown in this error."
            onRetry={() => void myBookingsQuery.refetch()}
          />
        ) : myBookings.length === 0 ? (
          <EmptyState
            title="No Appointments Yet"
            description="You haven't booked any appointments."
            action={<Button onClick={() => setView("booking")}>Book Your First Appointment</Button>}
          />
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
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={cancelBooking.isPending}
                            onClick={() => handleCancelBooking(booking.id)}
                          >
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
          {currentStep === 0 && (
            <StepPhysician
              physicians={physicians}
              isLoading={physiciansQuery.isLoading}
              isError={physiciansQuery.isError}
              onRetry={() => void physiciansQuery.refetch()}
              onSelect={handlePhysicianSelect}
            />
          )}
          {currentStep === 1 && (
            <StepDateTime
              physicianId={selectedPhysician}
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              appointmentType={appointmentType}
              onDateChange={(date) => {
                setSelectedDate(date);
                setSelectedTime("");
              }}
              onTimeChange={setSelectedTime}
              onAppointmentTypeChange={(type) => {
                setAppointmentType(type);
                setSelectedTime("");
              }}
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
              physician={physicians.find((physician) => physician.id === selectedPhysician)}
              isConfirming={createBooking.isPending}
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
