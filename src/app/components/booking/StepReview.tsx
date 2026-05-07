import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { physicians } from "../../data/mockData";
import { format } from "date-fns";
import { Calendar, FileText, User } from "lucide-react";
import type { AppointmentType, PatientDetails } from "@/types";

interface StepReviewProps {
  physicianId: string;
  selectedDate: Date | undefined;
  selectedTime: string;
  appointmentType: AppointmentType;
  patientDetails: PatientDetails;
  onBack: () => void;
  onConfirm: () => void;
}

export function StepReview({
  physicianId,
  selectedDate,
  selectedTime,
  appointmentType,
  patientDetails,
  onBack,
  onConfirm,
}: StepReviewProps) {
  const physician = physicians.find((p) => p.id === physicianId);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-2">Review & Confirm</h2>
        <p className="text-muted-foreground">Please review your appointment details before confirming</p>
      </div>

      <div className="space-y-4">
        <Card>
          <CardContent className="p-6">
            <h3 className="mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-[#2563eb]" />
              Physician Information
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{physician?.avatar}</span>
                <div>
                  <p className="font-medium">{physician?.name}</p>
                  <p className="text-sm text-muted-foreground">{physician?.specialty}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#2563eb]" />
              Appointment Details
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date:</span>
                <span className="font-medium">{selectedDate ? format(selectedDate, "EEEE, MMMM d, yyyy") : ""}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Time:</span>
                <span className="font-medium">{selectedTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type:</span>
                <span className="font-medium">{appointmentType}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#2563eb]" />
              Patient Information
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name:</span>
                <span className="font-medium">{patientDetails.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date of Birth:</span>
                <span className="font-medium">{format(new Date(patientDetails.dateOfBirth), "MM/dd/yyyy")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium">{patientDetails.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone:</span>
                <span className="font-medium">{patientDetails.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Insurance:</span>
                <span className="font-medium">{patientDetails.insurance}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Member ID:</span>
                <span className="font-medium">{patientDetails.insuranceMemberId}</span>
              </div>
              {patientDetails.isFirstTime && (
                <div className="pt-2 border-t">
                  <span className="text-sm text-[#2563eb]">First-time patient</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="mb-4">Reason for Visit</h3>
            <p className="text-sm">{patientDetails.reason}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3 pt-4">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button onClick={onConfirm} className="flex-1">
          Confirm Booking
        </Button>
      </div>
    </div>
  );
}
