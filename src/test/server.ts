import { setupServer } from "msw/node";

import { handlers } from "@/mocks/handlers";

/**
 * MSW server for unit/component tests. The same handlers run in the
 * browser via a service worker; here we intercept fetch at the Node
 * level so component tests exercise the real query/mutation pipeline
 * without making network calls.
 */
export const server = setupServer(...handlers);
