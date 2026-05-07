import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { physicians } from "@/services/mockData";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Search, Filter, LayoutGrid, LayoutList, Eye, CheckCircle, XCircle } from "lucide-react";
import type { Booking, BookingStatus, MutableBookingStatus } from "@/types";

interface AdminViewProps {
  bookings: Booking[];
  onUpdateStatus: (bookingId: string, status: MutableBookingStatus) => void;
}

export function AdminView({ bookings, onUpdateStatus }: AdminViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | BookingStatus>("all");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "calendar">("table");

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch = booking.patientName.toLowerCase().includes(searchTerm.toLowerCase()) || booking.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    pending: bookings.filter((b) => b.status === "Pending").length,
    confirmedToday: bookings.filter((b) => b.status === "Confirmed" && b.date === format(new Date(), "yyyy-MM-dd")).length,
    cancelledThisWeek: bookings.filter((b) => b.status === "Cancelled").length,
  };

  const handleConfirm = (bookingId: string) => {
    onUpdateStatus(bookingId, "Confirmed");
    setSelectedBooking(null);
  };

  const handleCancel = (bookingId: string) => {
    onUpdateStatus(bookingId, "Cancelled");
    setSelectedBooking(null);
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="mb-2">Physician Dashboard</h1>
        <p className="text-muted-foreground">Manage patient appointments and schedules</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <div className="h-8 w-8 rounded-full bg-[#fef3c7] flex items-center justify-center">
              <CalendarIcon className="h-4 w-4 text-[#92400e]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting confirmation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmed Today</CardTitle>
            <div className="h-8 w-8 rounded-full bg-[#d1fae5] flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-[#065f46]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.confirmedToday}</div>
            <p className="text-xs text-muted-foreground">Appointments for {format(new Date(), "MMM d")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancelled This Week</CardTitle>
            <div className="h-8 w-8 rounded-full bg-[#fee2e2] flex items-center justify-center">
              <XCircle className="h-4 w-4 text-[#991b1b]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.cancelledThisWeek}</div>
            <p className="text-xs text-muted-foreground">Past 7 days</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle>All Appointments</CardTitle>
            <div className="flex items-center gap-3">
              <div className="relative flex-1 md:w-[300px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by patient name or ID" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("all")}
                >
                  All
                </Button>
                <Button
                  variant={statusFilter === "Pending" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("Pending")}
                >
                  Pending
                </Button>
                <Button
                  variant={statusFilter === "Confirmed" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("Confirmed")}
                >
                  Confirmed
                </Button>
                <Button
                  variant={statusFilter === "Cancelled" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("Cancelled")}
                >
                  Cancelled
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredBookings.length === 0 ? (
            <div className="text-center py-12">
              <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No appointments found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Booking ID</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Patient</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Physician</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date & Time</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((booking) => {
                    const physician = physicians.find((p) => p.id === booking.physicianId);
                    return (
                      <tr key={booking.id} className="border-b border-border hover:bg-accent/50 transition-colors">
                        <td className="py-3 px-4 text-sm font-medium">{booking.id}</td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="text-sm font-medium">{booking.patientName}</p>
                            <p className="text-xs text-muted-foreground">{booking.patientEmail}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{physician?.avatar}</span>
                            <div>
                              <p className="text-sm font-medium">{physician?.name}</p>
                              <p className="text-xs text-muted-foreground">{physician?.specialty}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="text-sm">{format(new Date(booking.date), "MMM d, yyyy")}</p>
                            <p className="text-xs text-muted-foreground">{booking.time}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm">{booking.appointmentType}</td>
                        <td className="py-3 px-4">
                          <Badge variant={booking.status.toLowerCase() as "pending" | "confirmed" | "cancelled"}>
                            {booking.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setSelectedBooking(booking)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            {booking.status === "Pending" && (
                              <>
                                <Button variant="ghost" size="sm" onClick={() => handleConfirm(booking.id)}>
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleCancel(booking.id)}>
                                  <XCircle className="h-4 w-4 text-red-600" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Drawer open={selectedBooking !== null} onOpenChange={(open) => !open && setSelectedBooking(null)}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Appointment Details</DrawerTitle>
            <DrawerDescription>View complete information for this appointment</DrawerDescription>
          </DrawerHeader>

          {selectedBooking && (
            <div className="p-6 space-y-6 overflow-y-auto">
              <div>
                <h3 className="mb-3">Patient Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-medium">{selectedBooking.patientName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date of Birth:</span>
                    <span className="font-medium">{format(new Date(selectedBooking.dateOfBirth), "MM/dd/yyyy")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-medium">{selectedBooking.patientEmail}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone:</span>
                    <span className="font-medium">{selectedBooking.patientPhone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Insurance:</span>
                    <span className="font-medium">{selectedBooking.insurance}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Member ID:</span>
                    <span className="font-medium">{selectedBooking.insuranceMemberId}</span>
                  </div>
                  {selectedBooking.isFirstTime && (
                    <div className="pt-2 border-t">
                      <span className="text-sm text-[#2563eb]">First-time patient</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="mb-3">Appointment Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Booking ID:</span>
                    <span className="font-medium">{selectedBooking.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date:</span>
                    <span className="font-medium">{format(new Date(selectedBooking.date), "EEEE, MMMM d, yyyy")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Time:</span>
                    <span className="font-medium">{selectedBooking.time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="font-medium">{selectedBooking.appointmentType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant={selectedBooking.status.toLowerCase() as "pending" | "confirmed" | "cancelled"}>
                      {selectedBooking.status}
                    </Badge>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-3">Reason for Visit</h3>
                <p className="text-sm bg-accent/50 p-4 rounded-lg">{selectedBooking.reason}</p>
              </div>
            </div>
          )}

          <DrawerFooter>
            {selectedBooking?.status === "Pending" && (
              <div className="flex gap-3">
                <Button onClick={() => handleConfirm(selectedBooking.id)} className="flex-1">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirm Appointment
                </Button>
                <Button variant="destructive" onClick={() => handleCancel(selectedBooking.id)} className="flex-1">
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel Appointment
                </Button>
              </div>
            )}
            <DrawerClose asChild>
              <Button variant="outline">Close</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
