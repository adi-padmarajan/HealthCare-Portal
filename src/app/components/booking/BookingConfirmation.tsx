import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { CheckCircle2 } from "lucide-react";

interface BookingConfirmationProps {
  bookingId: string;
  onViewAppointments: () => void;
  onNewBooking: () => void;
}

export function BookingConfirmation({ bookingId, onViewAppointments, onNewBooking }: BookingConfirmationProps) {
  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <Card>
        <CardContent className="p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="rounded-full bg-[#d1fae5] p-3">
              <CheckCircle2 className="h-12 w-12 text-[#059669]" />
            </div>
          </div>

          <div>
            <h2 className="mb-2">Appointment Booked Successfully!</h2>
            <p className="text-muted-foreground">Your appointment request has been submitted</p>
          </div>

          <div className="bg-accent/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-center gap-2">
              <span className="text-sm text-muted-foreground">Booking ID:</span>
              <span className="font-medium">{bookingId}</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-sm text-muted-foreground">Status:</span>
              <Badge variant="pending">Pending</Badge>
            </div>
          </div>

          <div className="text-sm text-muted-foreground max-w-md mx-auto">
            <p>Your appointment is pending confirmation from the physician's office. You will receive an email confirmation once it has been reviewed.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button onClick={onViewAppointments} variant="outline" className="flex-1">
              View My Appointments
            </Button>
            <Button onClick={onNewBooking} className="flex-1">
              Book Another Appointment
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
