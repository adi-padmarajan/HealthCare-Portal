import { useState } from "react";
import { toast } from "sonner";

import { EmptyState, ErrorState, LoadingState } from "@/components/async-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuditLog, useBookings, usePhysicians, useUpdateBookingStatus } from "@/services/queries";
import { format } from "date-fns";
import { formatCalendarDate } from "@/lib/date";
import { Calendar as CalendarIcon, CheckCircle, Eye, Search, XCircle } from "lucide-react";
import type { AuditLogEntry, Booking, MutableBookingStatus } from "@/types";

type AdminTab = "Pending" | "Confirmed" | "Cancelled" | "All";
const ADMIN_TABS: readonly AdminTab[] = ["Pending", "Confirmed", "Cancelled", "All"] as const;

function emptyTitleForTab(tab: AdminTab, search: string): string {
  if (search) return "No matching appointments";
  switch (tab) {
    case "Pending":
      return "No pending bookings — you're all caught up!";
    case "Confirmed":
      return "No confirmed appointments";
    case "Cancelled":
      return "No cancelled bookings this period";
    case "All":
      return "No appointments yet";
  }
}

function emptyDescriptionForTab(tab: AdminTab, search: string): string | undefined {
  if (search) return "Try a different name or booking ID.";
  switch (tab) {
    case "Pending":
      return "New booking requests will appear here for confirmation.";
    case "Confirmed":
      return "Bookings you've confirmed will appear here.";
    case "Cancelled":
      return "Cancelled bookings stay here for the records-retention window.";
    case "All":
      return "Bookings will appear here as patients request appointments.";
  }
}

function formatAuditAction(entry: AuditLogEntry): string {
  if (entry.action === "BOOKING_STATUS_UPDATED") {
    return `Status: ${String(entry.metadata?.oldStatus ?? "?")} → ${String(entry.metadata?.newStatus ?? "?")}`;
  }
  if (entry.action === "BOOKING_DELETED") {
    return "Soft-deleted";
  }
  return entry.action;
}

export function AdminView() {
  const [searchTerm, setSearchTerm] = useState("");
  const [tab, setTab] = useState<AdminTab>("Pending");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [statusAnnouncement, setStatusAnnouncement] = useState("");
  const bookingsQuery = useBookings();
  const physiciansQuery = usePhysicians();
  const auditLogQuery = useAuditLog();
  const updateBookingStatus = useUpdateBookingStatus();
  const bookings = bookingsQuery.data ?? [];
  const physicians = physiciansQuery.data ?? [];
  const auditEntries = auditLogQuery.data ?? [];

  const counts: Record<AdminTab, number> = {
    All: bookings.length,
    Cancelled: bookings.filter((b) => b.status === "Cancelled").length,
    Confirmed: bookings.filter((b) => b.status === "Confirmed").length,
    Pending: bookings.filter((b) => b.status === "Pending").length,
  };

  const matchesSearch = (booking: Booking) => {
    const term = searchTerm.toLowerCase();
    if (!term) return true;
    return (
      booking.patientName.toLowerCase().includes(term) ||
      booking.id.toLowerCase().includes(term)
    );
  };

  const filterForTab = (activeTab: AdminTab) =>
    bookings.filter((booking) => {
      const matchesTab = activeTab === "All" || booking.status === activeTab;
      return matchesTab && matchesSearch(booking);
    });

  const stats = {
    pending: bookings.filter((b) => b.status === "Pending").length,
    confirmedToday: bookings.filter((b) => b.status === "Confirmed" && b.date === format(new Date(), "yyyy-MM-dd")).length,
    cancelledThisWeek: bookings.filter((b) => b.status === "Cancelled").length,
  };

  const handleConfirm = (bookingId: string) => {
    handleUpdateStatus(bookingId, "Confirmed");
  };

  const handleCancel = (bookingId: string) => {
    handleUpdateStatus(bookingId, "Cancelled");
  };

  const handleUpdateStatus = (bookingId: string, status: MutableBookingStatus) => {
    updateBookingStatus.mutate(
      { id: bookingId, status },
      {
        onError: () => {
          toast.error("Unable to update appointment", {
            description: "Please try again. No appointment details were included in this error.",
          });
        },
        onSuccess: () => {
          const message = status === "Confirmed" ? "Appointment confirmed" : "Appointment cancelled";
          toast.success(message);
          setStatusAnnouncement(message);
          setSelectedBooking(null);
        },
      },
    );
  };

  const isLoading = bookingsQuery.isLoading || physiciansQuery.isLoading;
  const isError = bookingsQuery.isError || physiciansQuery.isError;

  const renderBookingsTable = (rows: Booking[], activeTab: AdminTab) => {
    if (rows.length === 0) {
      return (
        <EmptyState
          framed={false}
          title={emptyTitleForTab(activeTab, searchTerm)}
          description={emptyDescriptionForTab(activeTab, searchTerm)}
        />
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full" aria-label={`${activeTab} appointments`}>
          <thead>
            <tr className="border-b border-border">
              <th scope="col" className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Booking ID</th>
              <th scope="col" className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Patient</th>
              <th scope="col" className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Physician</th>
              <th scope="col" className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date & Time</th>
              <th scope="col" className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Type</th>
              <th scope="col" className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
              <th scope="col" className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((booking) => {
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
                      <span className="text-lg" aria-hidden="true">{physician?.avatar}</span>
                      <div>
                        <p className="text-sm font-medium">{physician?.name}</p>
                        <p className="text-xs text-muted-foreground">{physician?.specialty}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="text-sm">{formatCalendarDate(booking.date, "MMM d, yyyy")}</p>
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
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`View details for booking ${booking.id}`}
                        onClick={() => setSelectedBooking(booking)}
                      >
                        <Eye className="h-4 w-4" aria-hidden="true" />
                      </Button>
                      {booking.status === "Pending" && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label={`Confirm appointment ${booking.id}`}
                            disabled={updateBookingStatus.isPending}
                            onClick={() => handleConfirm(booking.id)}
                          >
                            <CheckCircle className="h-4 w-4 text-green-600" aria-hidden="true" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label={`Cancel appointment ${booking.id}`}
                            disabled={updateBookingStatus.isPending}
                            onClick={() => handleCancel(booking.id)}
                          >
                            <XCircle className="h-4 w-4 text-red-600" aria-hidden="true" />
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
    );
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      {/* Screen-reader live region for status update announcements */}
      <div role="status" aria-live="polite" className="sr-only">
        {statusAnnouncement}
      </div>

      <div className="mb-8">
        <h1 className="mb-2">Physician Dashboard</h1>
        <p className="text-muted-foreground">Manage patient appointments and schedules</p>
      </div>

      {isLoading && <LoadingState message="Loading appointment dashboard..." />}

      {isError && (
        <ErrorState
          title="Unable to load appointment dashboard"
          message="Please try again. Appointment details are not shown in this error."
          onRetry={() => {
            void bookingsQuery.refetch();
            void physiciansQuery.refetch();
          }}
        />
      )}

      {!isLoading && !isError && <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <div className="h-8 w-8 rounded-full bg-[#fef3c7] flex items-center justify-center" aria-hidden="true">
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
            <div className="h-8 w-8 rounded-full bg-[#d1fae5] flex items-center justify-center" aria-hidden="true">
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
            <div className="h-8 w-8 rounded-full bg-[#fee2e2] flex items-center justify-center" aria-hidden="true">
              <XCircle className="h-4 w-4 text-[#991b1b]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.cancelledThisWeek}</div>
            <p className="text-xs text-muted-foreground">Past 7 days</p>
          </CardContent>
        </Card>
      </div>}

      {!isLoading && !isError && <Card className="mb-8">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle>Appointments</CardTitle>
            <div className="relative flex-1 md:w-[300px] md:flex-none">
              <label htmlFor="booking-search" className="sr-only">
                Search appointments by patient name or booking ID
              </label>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Input
                id="booking-search"
                placeholder="Search by patient name or ID"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={(value) => setTab(value as AdminTab)}>
            <TabsList className="mb-4 h-auto flex-wrap" aria-label="Filter appointments by status">
              {ADMIN_TABS.map((tabValue) => (
                <TabsTrigger key={tabValue} value={tabValue} className="gap-2">
                  <span>{tabValue}</span>
                  <span
                    aria-label={`${counts[tabValue]} ${tabValue === "All" ? "total" : tabValue.toLowerCase()}`}
                    className="inline-flex min-w-[1.5rem] items-center justify-center rounded-full bg-muted-foreground/15 px-2 text-xs font-medium tabular-nums data-[state=active]:bg-foreground/10"
                  >
                    {counts[tabValue]}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
            {ADMIN_TABS.map((tabValue) => (
              <TabsContent key={tabValue} value={tabValue} className="mt-0">
                {renderBookingsTable(filterForTab(tabValue), tabValue)}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>}

      {!isLoading && !isError && (
        <Card>
          <CardHeader>
            <CardTitle>Audit Log</CardTitle>
          </CardHeader>
          <CardContent>
            {auditLogQuery.isLoading ? (
              <LoadingState message="Loading audit log..." />
            ) : auditEntries.length === 0 ? (
              <EmptyState
                framed={false}
                title="No audit entries yet"
                description="Status changes and deletions will appear here."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full" aria-label="Admin audit log">
                  <thead>
                    <tr className="border-b border-border">
                      <th scope="col" className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Time</th>
                      <th scope="col" className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Actor</th>
                      <th scope="col" className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Action</th>
                      <th scope="col" className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Booking ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditEntries.map((entry) => (
                      <tr key={entry.id} className="border-b border-border text-sm">
                        <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                          {format(new Date(entry.timestamp), "MMM d, h:mm a")}
                        </td>
                        <td className="py-3 px-4">{entry.actorId}</td>
                        <td className="py-3 px-4">{formatAuditAction(entry)}</td>
                        <td className="py-3 px-4 font-mono text-xs">{entry.targetId}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
                    <span className="font-medium">{formatCalendarDate(selectedBooking.dateOfBirth, "MM/dd/yyyy")}</span>
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
                    <span className="font-medium">{formatCalendarDate(selectedBooking.date, "EEEE, MMMM d, yyyy")}</span>
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
                <Button onClick={() => handleConfirm(selectedBooking.id)} disabled={updateBookingStatus.isPending} className="flex-1">
                  <CheckCircle className="h-4 w-4 mr-2" aria-hidden="true" />
                  Confirm Appointment
                </Button>
                <Button variant="destructive" onClick={() => handleCancel(selectedBooking.id)} disabled={updateBookingStatus.isPending} className="flex-1">
                  <XCircle className="h-4 w-4 mr-2" aria-hidden="true" />
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


