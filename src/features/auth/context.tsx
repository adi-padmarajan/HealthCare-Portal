import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { authToken } from "@/services/authToken";

import { mockLogin, mockSignUp } from "./mock-auth";
import type { AuthUser, LoginCredentials, SignUpCredentials } from "./types";

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

interface AuthContextValue {
  /** The currently signed-in user, or null if unauthenticated. */
  currentUser: AuthUser | null;
  isAdmin: boolean;
  /** True while an auth operation is in flight. */
  isLoading: boolean;
  isSignedIn: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  signUp: (credentials: SignUpCredentials) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      // mockLogin is synchronous; the async wrapper keeps the interface
      // identical to what a real Clerk integration would expose.
      const session = mockLogin(credentials);
      authToken.set(session.token);
      setCurrentUser(session.user);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signUp = useCallback(async (credentials: SignUpCredentials) => {
    setIsLoading(true);
    try {
      const session = mockSignUp(credentials);
      authToken.set(session.token);
      setCurrentUser(session.user);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    authToken.set(null);
    setCurrentUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      currentUser,
      isAdmin: currentUser?.role === "admin",
      isLoading,
      isSignedIn: currentUser !== null,
      login,
      logout,
      signUp,
    }),
    [currentUser, isLoading, login, logout, signUp],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ---------------------------------------------------------------------------
// Internal hook — not exported from the feature index
// ---------------------------------------------------------------------------

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext must be used inside <AuthProvider>.");
  }
  return ctx;
}
