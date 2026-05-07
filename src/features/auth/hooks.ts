import { useAuthContext } from "./context";

/**
 * Primary auth hook — exposes the full context value.
 * Mirrors the surface of Clerk's useAuth() for easy migration.
 */
export function useAuth() {
  return useAuthContext();
}

/**
 * Returns the currently signed-in user, or null.
 * Mirrors Clerk's useUser().user.
 */
export function useCurrentUser() {
  return useAuthContext().currentUser;
}

/** Returns true when the current user has the admin role. */
export function useIsAdmin() {
  return useAuthContext().isAdmin;
}

/** Returns true when a user is signed in. */
export function useIsSignedIn() {
  return useAuthContext().isSignedIn;
}
