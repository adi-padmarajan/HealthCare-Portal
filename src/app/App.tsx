import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { AdminView } from "@/features/admin";
import { PatientView } from "@/features/patient";
import { initialBookings } from "@/services/mockData";
import { Users, Stethoscope } from "lucide-react";
import type { Booking, CreateBookingInput, MutableBookingStatus, UserRole } from "@/types";

export default function App() {
  const [userRole, setUserRole] = useState<UserRole>("patient");
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);

  const handleAddBooking = (newBooking: CreateBookingInput) => {
    const id = `B${String(Math.floor(Math.random() * 9000) + 1000)}`;
    setBookings([...bookings, { ...newBooking, id }]);
    toast.success("Appointment request submitted", {
      description: "The appointment is pending office confirmation.",
    });
  };

  const handleUpdateStatus = (bookingId: string, status: MutableBookingStatus) => {
    setBookings(bookings.map((b) => (b.id === bookingId ? { ...b, status } : b)));
    toast.success(status === "Confirmed" ? "Appointment confirmed" : "Appointment cancelled");
  };

  const handleCancelBooking = (bookingId: string) => {
    setBookings(bookings.map((b) => (b.id === bookingId ? { ...b, status: "Cancelled" as const } : b)));
    toast.info("Appointment cancelled");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#eff6ff] to-[#f0fdf4]">
      <header className="bg-white border-b border-border shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-[#2563eb] flex items-center justify-center">
                <Stethoscope className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg">HealthCare Portal</h1>
                <p className="text-xs text-muted-foreground">Patient Appointment Management</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground hidden sm:inline">View as:</span>
              <div className="flex gap-2 bg-accent/50 p-1 rounded-lg">
                <Button
                  variant={userRole === "patient" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setUserRole("patient")}
                  className="gap-2"
                >
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Patient</span>
                </Button>
                <Button
                  variant={userRole === "admin" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setUserRole("admin")}
                  className="gap-2"
                >
                  <Stethoscope className="h-4 w-4" />
                  <span className="hidden sm:inline">Admin</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main>
        {userRole === "patient" ? (
          <PatientView bookings={bookings} onAddBooking={handleAddBooking} onCancelBooking={handleCancelBooking} />
        ) : (
          <AdminView bookings={bookings} onUpdateStatus={handleUpdateStatus} />
        )}
      </main>

      <footer className="bg-white border-t border-border mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>© 2026 HealthCare Portal. All rights reserved. Built with care for better patient experiences.</p>
        </div>
      </footer>
      <Toaster closeButton position="top-right" richColors />
    </div>
  );
}
