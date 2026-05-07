import { EmptyState, ErrorState, LoadingState } from "@/components/async-state";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { cn } from "@/components/ui/utils";
import { useAvailability } from "@/services/queries";
import { addDays, format, isBefore, startOfToday } from "date-fns";
import type { AppointmentType, PhysicianId } from "@/types";

interface StepDateTimeProps {
  appointmentType: AppointmentType;
  conflictError?: string | null;
  onDateChange: (date: Date | undefined) => void;
  onAppointmentTypeChange: (type: AppointmentType) => void;
  onBack: () => void;
  onNext: () => void;
  onTimeChange: (time: string) => void;
  physicianId: PhysicianId;
  selectedDate: Date | undefined;
  selectedTime: string;
}

export function StepDateTime({
  selectedDate,
  selectedTime,
  appointmentType,
  conflictError,
  onDateChange,
  onTimeChange,
  onAppointmentTypeChange,
  onNext,
  onBack,
  physicianId,
}: StepDateTimeProps) {
  const today = startOfToday();
  const maxDate = addDays(today, 14);
  const selectedDateValue = selectedDate ? format(selectedDate, "yyyy-MM-dd") : undefined;
  const availabilityQuery = useAvailability(
    {
      appointmentType,
      date: selectedDateValue,
      physicianId,
    },
    Boolean(selectedDateValue && physicianId),
  );

  const slots = availabilityQuery.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-2">Select Appointment Time</h2>
        <p className="text-muted-foreground">Choose a convenient date and time for your visit</p>
      </div>

      {conflictError && (
        <div
          role="alert"
          className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {conflictError}
        </div>
      )}

      <div>
        <label className="mb-3 block">Appointment Type</label>
        <div className="flex gap-3">
          <Button
            variant={appointmentType === "In-person" ? "default" : "outline"}
            onClick={() => onAppointmentTypeChange("In-person")}
            className="flex-1"
          >
            In-person Visit
          </Button>
          <Button
            variant={appointmentType === "Telehealth" ? "default" : "outline"}
            onClick={() => onAppointmentTypeChange("Telehealth")}
            className="flex-1"
          >
            Telehealth
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="mb-3 block">Select Date</label>
          <Card className="p-3">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={onDateChange}
              disabled={(date) => isBefore(date, today) || date > maxDate}
              initialFocus
            />
          </Card>
        </div>

        <div>
          <label className="mb-3 block">Available Time Slots</label>
          {selectedDate && availabilityQuery.isLoading && (
            <LoadingState framed={false} message="Loading available times..." />
          )}

          {selectedDate && availabilityQuery.isError && (
            <ErrorState
              framed={false}
              title="Unable to load available times"
              message="Please try again or select a different date."
              onRetry={() => void availabilityQuery.refetch()}
            />
          )}

          {selectedDate && availabilityQuery.isSuccess && slots.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {slots.map((slot) => {
                const isUnavailable = slot.status === "Unavailable";
                return (
                  <button
                    key={slot.id}
                    onClick={() => !isUnavailable && onTimeChange(slot.time)}
                    disabled={isUnavailable}
                    className={cn(
                      "p-3 rounded-lg border text-sm transition-colors",
                      selectedTime === slot.time && "bg-[#2563eb] text-white border-[#2563eb]",
                      selectedTime !== slot.time && !isUnavailable && "border-border hover:bg-accent",
                      isUnavailable && "opacity-50 cursor-not-allowed bg-muted",
                    )}
                  >
                    {slot.time}
                    {isUnavailable && <span className="block text-xs">Unavailable</span>}
                  </button>
                );
              })}
            </div>
          )}

          {selectedDate && availabilityQuery.isSuccess && slots.length === 0 && (
            <EmptyState framed={false} title="No available times" description="Select another date or appointment type." />
          )}

          {!selectedDate && (
            <div className="flex items-center justify-center h-full border border-dashed border-border rounded-lg p-8">
              <p className="text-muted-foreground text-center">Please select a date to view available times</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button onClick={onNext} disabled={!selectedDate || !selectedTime || availabilityQuery.isLoading} className="flex-1">
          Continue
        </Button>
      </div>
    </div>
  );
}
