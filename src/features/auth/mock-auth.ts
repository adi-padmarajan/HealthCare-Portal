/**
 * Mock auth operations — DEV ONLY.
 *
 * Seeded accounts:
 *   patient@example.com / Demo1234!  →  role: patient
 *   admin@example.com   / Demo1234!  →  role: admin
 *
 * Sign-up creates a new patient account that persists for the session.
 * All accounts are reset when the page is reloaded.
 *
 * Remove this file and replace AuthProvider with <ClerkProvider> when
 * integrating a real auth provider (see docs/decisions/auth-provider.md).
 */

import { createMockToken } from "@/services/authToken";

import type { AuthUser, LoginCredentials, SignUpCredentials } from "./types";

// ---------------------------------------------------------------------------
// Seeded accounts
// ---------------------------------------------------------------------------

const SEED_USERS: AuthUser[] = [
  {
    id: "usr-patient-1",
    email: "patient@example.com",
    name: "Alex Patient",
    role: "patient",
  },
  {
    id: "usr-admin-1",
    email: "admin@example.com",
    name: "Admin User",
    role: "admin",
  },
];

// In-memory registry — sign-up appends here
let registry: AuthUser[] = [...SEED_USERS];

// Single dev password for all seeded accounts
const DEV_PASSWORD = "Demo1234!";

// ---------------------------------------------------------------------------
// Auth operations
// ---------------------------------------------------------------------------

export interface AuthSession {
  user: AuthUser;
  token: string;
}

export function mockLogin(credentials: LoginCredentials): AuthSession {
  const user = registry.find(
    (u) => u.email.toLowerCase() === credentials.email.toLowerCase(),
  );

  if (!user || credentials.password !== DEV_PASSWORD) {
    throw new Error("Invalid email or password.");
  }

  return { user, token: createMockToken(user) };
}

export function mockSignUp(credentials: SignUpCredentials): AuthSession {
  if (credentials.password !== credentials.confirmPassword) {
    throw new Error("Passwords do not match.");
  }

  const existing = registry.find(
    (u) => u.email.toLowerCase() === credentials.email.toLowerCase(),
  );

  if (existing) {
    throw new Error("An account with this email already exists.");
  }

  const newUser: AuthUser = {
    id: `usr-${Date.now()}`,
    email: credentials.email,
    name: credentials.name,
    role: "patient", // sign-up always creates a patient account
  };

  registry = [...registry, newUser];
  return { user: newUser, token: createMockToken(newUser) };
}
