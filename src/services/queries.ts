import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api, type AvailabilityFilters, type BookingFilters } from "@/services/api";
import type { Booking, CreateBookingInput, MutableBookingStatus } from "@/types";

export const queryKeys = {
  availability: (filters: AvailabilityFilters) => ["availability", filters] as const,
  bookings: (filters: BookingFilters = {}) => ["bookings", filters] as const,
  bookingsRoot: ["bookings"] as const,
  physicians: ["physicians"] as const,
};

export function usePhysicians() {
  return useQuery({
    queryFn: ({ signal }) => api.physicians.list(signal),
    queryKey: queryKeys.physicians,
  });
}

export function useAvailability(filters: AvailabilityFilters, enabled: boolean) {
  return useQuery({
    enabled,
    queryFn: ({ signal }) => api.availability.list(filters, signal),
    queryKey: queryKeys.availability(filters),
  });
}

export function useBookings(filters: BookingFilters = {}, enabled = true) {
  return useQuery({
    enabled,
    queryFn: ({ signal }) => api.bookings.list(filters, signal),
    queryKey: queryKeys.bookings(filters),
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateBookingInput) => api.bookings.create(input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.bookingsRoot });

      const snapshots = queryClient.getQueriesData<Booking[]>({
        queryKey: queryKeys.bookingsRoot,
      });

      // Optimistic booking — server assigns the real id on success.
      const optimisticBooking: Booking = {
        ...input,
        id: `optimistic-${Date.now()}`,
      };

      queryClient.setQueriesData<Booking[]>(
        { queryKey: queryKeys.bookingsRoot },
        (bookings) => [...(bookings ?? []), optimisticBooking],
      );

      return { snapshots };
    },
    onError: (_error, _input, context) => {
      context?.snapshots.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.bookingsRoot });
      void queryClient.invalidateQueries({ queryKey: ["availability"] });
    },
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.bookings.cancel(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.bookingsRoot });

      const snapshots = queryClient.getQueriesData<Booking[]>({
        queryKey: queryKeys.bookingsRoot,
      });

      queryClient.setQueriesData<Booking[]>({ queryKey: queryKeys.bookingsRoot }, (bookings) =>
        bookings?.map((booking) =>
          booking.id === id ? { ...booking, status: "Cancelled" } : booking,
        ),
      );

      return { snapshots };
    },
    onError: (_error, _id, context) => {
      context?.snapshots.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.bookingsRoot });
      void queryClient.invalidateQueries({ queryKey: ["availability"] });
    },
  });
}

export function useUpdateBookingStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: MutableBookingStatus }) =>
      api.bookings.updateStatus(id, { status }),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.bookingsRoot });

      const snapshots = queryClient.getQueriesData<Booking[]>({
        queryKey: queryKeys.bookingsRoot,
      });

      queryClient.setQueriesData<Booking[]>({ queryKey: queryKeys.bookingsRoot }, (bookings) =>
        bookings?.map((booking) => (booking.id === id ? { ...booking, status } : booking)),
      );

      return { snapshots };
    },
    onError: (_error, _variables, context) => {
      context?.snapshots.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.bookingsRoot });
      void queryClient.invalidateQueries({ queryKey: ["availability"] });
    },
  });
}
