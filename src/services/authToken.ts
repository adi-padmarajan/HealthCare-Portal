/**
 * Module-level auth token store used by the API layer to attach the
 * Authorization header without needing access to React context.
 *
 * The fetch utility in api.ts stays framework-agnostic by reading from
 * this module rather than from a React hook.
 *
 * When integrating a real auth provider (e.g. Clerk), replace the
 * authToken.set() calls in AuthProvider with the provider's getToken()
 * callback and remove the mock-token helpers below.
 */

// ---------------------------------------------------------------------------
// Token store
// ---------------------------------------------------------------------------

let currentToken: string | null = null;

export const authToken = {
  get: (): string | null => currentToken,
  set: (token: string | null): void => {
    currentToken = token;
  },
};

// ---------------------------------------------------------------------------
// Mock token helpers — DEV ONLY, not cryptographically secure
// Remove when integrating a real auth provider.
// ---------------------------------------------------------------------------

export interface MockTokenPayload {
  id: string;
  email: string;
  name: string;
  role: "patient" | "admin";
  /** Unix timestamp (ms) */
  exp: number;
}

export function createMockToken(
  payload: Omit<MockTokenPayload, "exp">,
): string {
  const full: MockTokenPayload = {
    ...payload,
    exp: Date.now() + 8 * 60 * 60 * 1000, // 8 hours
  };
  return `mock.${btoa(JSON.stringify(full))}`;
}

export function parseMockToken(token: string): MockTokenPayload | null {
  if (!token.startsWith("mock.")) return null;
  try {
    const payload = JSON.parse(atob(token.slice(5))) as MockTokenPayload;
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
