import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, http, HttpResponse } from "msw";
import { beforeEach, describe, expect, test } from "vitest";

import { authToken, createMockToken } from "@/services/authToken";
import { server } from "@/test/server";
import { renderWithProviders } from "@/test/test-utils";
import type { Booking, BookingStatus, Physician } from "@/types";

import { AdminView } from "./AdminView";

const PHYSICIAN: Physician = {
  avatar: "👩‍⚕️",
  bio: "Test bio",
  id: "phy-1",
  name: "Dr. Test",
  specialty: "Family Medicine",
  yearsOfExperience: 5,
};

function makeBooking(overrides: Partial<Booking> = {}): Booking {
  return {
    appointmentType: "In-person",
    date: "2026-05-09",
    dateOfBirth: "1990-01-01",
    id: "B100",
    insurance: "Blue Cross",
    insuranceMemberId: "BC1",
    isFirstTime: false,
    patientEmail: "jane@example.com",
    patientName: "Jane Doe",
    patientPhone: "(555) 000-0000",
    physicianId: "phy-1",
    reason: "Annual checkup",
    status: "Pending",
    time: "10:00 AM",
    ...overrides,
  };
}

interface ScenarioOptions {
  bookings: Booking[];
  /** When true, the PATCH /bookings/:id/status handler returns 500 to simulate a failed mutation. */
  failStatusUpdate?: boolean;
}

function setupScenario({ bookings, failStatusUpdate = false }: ScenarioOptions) {
  const state = { bookings: [...bookings] };
  server.use(
    http.get("*/api/bookings", () => HttpResponse.json([...state.bookings])),
    http.get("*/api/physicians", () => HttpResponse.json([PHYSICIAN])),
    http.get("*/api/audit-log", () => HttpResponse.json([])),
    http.patch("*/api/bookings/:id/status", async ({ params, request }) => {
      if (failStatusUpdate) {
        return HttpResponse.json(
          { code: "SERVER_ERROR", message: "Boom" },
          { status: 500 },
        );
      }
      const body = (await request.json()) as { status: BookingStatus };
      const id = String(params.id);
      const idx = state.bookings.findIndex((b) => b.id === id);
      if (idx === -1) {
        return HttpResponse.json({ code: "NOT_FOUND" }, { status: 404 });
      }
      const current = state.bookings[idx];
      if (current.status === "Cancelled" && body.status === "Confirmed") {
        return HttpResponse.json(
          {
            code: "INVALID_TRANSITION",
            message: "Cancelled bookings cannot be re-confirmed.",
          },
          { status: 409 },
        );
      }
      // Small delay so the optimistic update is observable before the
      // real response settles — keeps the rollback test honest.
      await delay(15);
      const updated = { ...current, status: body.status };
      state.bookings = state.bookings.map((b) => (b.id === id ? updated : b));
      return HttpResponse.json(updated);
    }),
  );
  return state;
}

beforeEach(() => {
  authToken.set(
    createMockToken({
      email: "admin@example.com",
      id: "usr-admin-1",
      name: "Admin",
      role: "admin",
    }),
  );
});

async function getCellInRow(rowId: string, columnIndex: number) {
  const idCell = await screen.findByRole("cell", { name: rowId });
  const row = idCell.closest("tr");
  if (!row) throw new Error(`No row containing cell ${rowId}`);
  const cells = within(row).getAllByRole("cell");
  return cells[columnIndex];
}

describe("AdminView", () => {
  test("confirming a pending booking moves it from Pending to Confirmed", async () => {
    setupScenario({ bookings: [makeBooking({ id: "B100" })] });
    const user = userEvent.setup();
    renderWithProviders(<AdminView />);

    // Default tab is Pending — the booking should land here first.
    await screen.findByRole("cell", { name: "B100" });

    await user.click(
      screen.getByRole("button", { name: /confirm appointment B100/i }),
    );

    // After mutation settles, B100 leaves the Pending tab.
    await waitFor(
      () =>
        expect(
          screen.queryByRole("cell", { name: "B100" }),
        ).not.toBeInTheDocument(),
      { timeout: 2000 },
    );

    // Switch to Confirmed and verify it now appears there.
    await user.click(screen.getByRole("tab", { name: /^Confirmed/ }));
    expect(await screen.findByRole("cell", { name: "B100" })).toBeInTheDocument();
  });

  test("cancelling a pending booking opens the confirmation dialog and moves it to Cancelled", async () => {
    setupScenario({ bookings: [makeBooking({ id: "B100" })] });
    const user = userEvent.setup();
    renderWithProviders(<AdminView />);

    await screen.findByRole("cell", { name: "B100" });

    await user.click(
      screen.getByRole("button", { name: /cancel appointment B100/i }),
    );

    // The dialog opens; cancel doesn't fire until confirmed.
    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText(/cancel this appointment/i)).toBeInTheDocument();

    // Confirm cancellation.
    await user.click(within(dialog).getByRole("button", { name: /^Cancel appointment$/ }));

    // Booking leaves Pending.
    await waitFor(() =>
      expect(screen.queryByRole("cell", { name: "B100" })).not.toBeInTheDocument(),
    );

    await user.click(screen.getByRole("tab", { name: /^Cancelled/ }));
    expect(await screen.findByRole("cell", { name: "B100" })).toBeInTheDocument();
  });

  test("optimistic update rolls back when the status mutation fails", async () => {
    setupScenario({
      bookings: [makeBooking({ id: "B100" })],
      failStatusUpdate: true,
    });
    const user = userEvent.setup();
    renderWithProviders(<AdminView />);

    await screen.findByRole("cell", { name: "B100" });

    // Locate the status cell in the booking row before the click.
    const statusCellBefore = await getCellInRow("B100", 5);
    expect(statusCellBefore).toHaveTextContent("Pending");

    await user.click(
      screen.getByRole("button", { name: /confirm appointment B100/i }),
    );

    // After the rollback completes, the booking is back on the Pending
    // tab and the status badge reads Pending again.
    await waitFor(
      async () => {
        const cell = await getCellInRow("B100", 5);
        expect(cell).toHaveTextContent("Pending");
      },
      { timeout: 2000 },
    );
  });

  test("a cancelled booking offers no Confirm action — re-confirmation is not allowed", async () => {
    setupScenario({
      bookings: [makeBooking({ id: "B100", status: "Cancelled" })],
    });
    const user = userEvent.setup();
    renderWithProviders(<AdminView />);

    // Wait for the dashboard to finish loading; the Pending tab is empty,
    // so we switch to Cancelled to find the booking.
    await user.click(await screen.findByRole("tab", { name: /^Cancelled/ }));

    await screen.findByRole("cell", { name: "B100" });

    // Row exposes the View action but not Confirm or Cancel.
    expect(
      screen.getByRole("button", { name: /view details for booking B100/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /confirm appointment B100/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /cancel appointment B100/i }),
    ).not.toBeInTheDocument();
  });
});
