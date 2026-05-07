import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { cn } from "@/components/ui/utils";
import { timeSlots } from "@/services/mockData";
import { addDays, isBefore, startOfToday } from "date-fns";
import type { AppointmentType } from "@/types";

interface StepDateTimeProps {
  selectedDate: Date | undefined;
  selectedTime: string;
  appointmentType: AppointmentType;
  onDateChange: (date: Date | undefined) => void;
  onTimeChange: (time: string) => void;
  onAppointmentTypeChange: (type: AppointmentType) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepDateTime({
  selectedDate,
  selectedTime,
  appointmentType,
  onDateChange,
  onTimeChange,
  onAppointmentTypeChange,
  onNext,
  onBack,
}: StepDateTimeProps) {
  const today = startOfToday();
  const maxDate = addDays(today, 14);

  const unavailableSlots = ["9:30 AM", "2:00 PM"];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-2">Select Appointment Time</h2>
        <p className="text-muted-foreground">Choose a convenient date and time for your visit</p>
      </div>

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
          {selectedDate ? (
            <div className="grid grid-cols-2 gap-2">
              {timeSlots.map((slot) => {
                const isUnavailable = unavailableSlots.includes(slot);
                return (
                  <button
                    key={slot}
                    onClick={() => !isUnavailable && onTimeChange(slot)}
                    disabled={isUnavailable}
                    className={cn(
                      "p-3 rounded-lg border text-sm transition-colors",
                      selectedTime === slot && "bg-[#2563eb] text-white border-[#2563eb]",
                      selectedTime !== slot && !isUnavailable && "border-border hover:bg-accent",
                      isUnavailable && "opacity-50 cursor-not-allowed bg-muted"
                    )}
                  >
                    {slot}
                    {isUnavailable && <span className="block text-xs">Unavailable</span>}
                  </button>
                );
              })}
            </div>
          ) : (
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
        <Button onClick={onNext} disabled={!selectedDate || !selectedTime} className="flex-1">
          Continue
        </Button>
      </div>
    </div>
  );
}
