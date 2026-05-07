import { expect, test } from "@playwright/test";

/**
 * Happy-path admin flow: log in, confirm a pending booking, then cancel
 * the now-confirmed booking. Exercises the full pipeline against the MSW
 * mock running in the browser.
 *
 * The seeded bookings in src/services/mockData.ts include B002 — Emma
 * Davis, status Pending. We pick that one because it doesn't depend on
 * "today" matching any particular date.
 */
test("admin confirms a pending booking, then cancels it", async ({ page }) => {
  // Scoped to the appointments table so we don't match the same booking id
  // showing up in the admin audit log table further down the page.
  const apptTable = page.getByRole("table", { name: /appointments$/i });
  const bookingCell = apptTable.getByRole("cell", { exact: true, name: "B002" });

  await page.goto("/");

  // ----- Login as admin -----
  await page.getByLabel("Email address").fill("admin@example.com");
  await page.getByLabel("Password").fill("Demo1234!");
  await page.getByRole("button", { name: "Sign in" }).click();

  // The Pending tab is the default landing tab.
  await expect(page.getByRole("tab", { name: /^Pending/ })).toBeVisible();

  // B002 is a seeded Pending booking.
  await expect(bookingCell).toBeVisible();

  // ----- Confirm it -----
  await page.getByRole("button", { name: /confirm appointment B002/i }).click();

  // Switch to Confirmed and verify it landed there.
  await page.getByRole("tab", { name: /^Confirmed/ }).click();
  await expect(bookingCell).toBeVisible();

  // ----- Cancel the now-confirmed booking -----
  await page.getByRole("button", { name: /cancel appointment B002/i }).click();

  // The dialog uses the stronger "confirmed appointment" copy variant.
  const dialog = page.getByRole("alertdialog");
  await expect(dialog).toContainText(/cancel this confirmed appointment/i);

  await dialog.getByRole("button", { name: "Cancel appointment" }).click();

  // Move to Cancelled and verify it landed there.
  await page.getByRole("tab", { name: /^Cancelled/ }).click();
  await expect(bookingCell).toBeVisible();
});
