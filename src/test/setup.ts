import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";

import { authToken } from "@/services/authToken";

import { server } from "./server";

beforeAll(() => {
  // "warn" means handlers we forgot to define produce a warning instead
  // of failing — keeps unrelated queries from breaking each test.
  server.listen({ onUnhandledRequest: "warn" });
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
  authToken.set(null);
});

afterAll(() => {
  server.close();
});
