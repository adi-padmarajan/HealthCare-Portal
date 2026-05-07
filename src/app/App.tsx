import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { AdminView } from "@/features/admin";
import { useAuth, LoginPage, SignUpPage } from "@/features/auth";
import { PatientView } from "@/features/patient";
import { LogOut, Stethoscope, User } from "lucide-react";

export default function App() {
  const { currentUser, isAdmin, isSignedIn, logout } = useAuth();
  const [authView, setAuthView] = useState<"login" | "signup">("login");

  // Not authenticated — show the login wall
  if (!isSignedIn) {
    return authView === "login" ? (
      <LoginPage onNavigateToSignUp={() => setAuthView("signup")} />
    ) : (
      <SignUpPage onNavigateToLogin={() => setAuthView("login")} />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#eff6ff] to-[#f0fdf4]">
      <header className="sticky top-0 z-10 border-b border-border bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2563eb]">
                <Stethoscope className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <div>
                <h1 className="text-lg">HealthCare Portal</h1>
                <p className="text-xs text-muted-foreground">
                  Patient Appointment Management
                </p>
              </div>
            </div>

            {/* User info + logout */}
            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
                <User className="h-4 w-4" aria-hidden="true" />
                <span>{currentUser?.name}</span>
                <span className="rounded-full bg-accent px-2 py-0.5 text-xs capitalize">
                  {currentUser?.role}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main>
        {isAdmin ? <AdminView /> : <PatientView />}
      </main>

      <footer className="mt-12 border-t border-border bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 text-center text-sm text-muted-foreground">
          <p>
            © 2026 HealthCare Portal. All rights reserved. Built with care for
            better patient experiences.
          </p>
        </div>
      </footer>

      <Toaster closeButton position="top-right" richColors />
    </div>
  );
}
