import type { ReactNode } from "react";

import { useAuthContext } from "../context";
import type { AuthUser } from "../types";

interface ProtectedRouteProps {
  /** Content to render when the user passes the access check. */
  children: ReactNode;
  /** Content to render when the user is not authorized. */
  fallback: ReactNode;
  /**
   * When specified, the user must have exactly this role in addition to
   * being signed in. Omit to require only authentication.
   */
  requiredRole?: AuthUser["role"];
}

/**
 * Conditionally renders children based on authentication state and
 * optional role requirement. Renders fallback otherwise.
 *
 * Usage:
 *   <ProtectedRoute requiredRole="admin" fallback={<AccessDenied />}>
 *     <AdminView />
 *   </ProtectedRoute>
 */
export function ProtectedRoute({
  children,
  fallback,
  requiredRole,
}: ProtectedRouteProps) {
  const { currentUser, isSignedIn } = useAuthContext();

  if (!isSignedIn) {
    return fallback;
  }

  if (requiredRole && currentUser?.role !== requiredRole) {
    return fallback;
  }

  return children;
}
