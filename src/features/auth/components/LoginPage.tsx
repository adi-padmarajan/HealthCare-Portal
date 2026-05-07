import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { loginSchema } from "@/lib/schemas/auth";
import type { LoginFormValues } from "@/lib/schemas/auth";
import { Stethoscope } from "lucide-react";

import { useAuthContext } from "../context";

interface LoginPageProps {
  onNavigateToSignUp: () => void;
}

export function LoginPage({ onNavigateToSignUp }: LoginPageProps) {
  const { login } = useAuthContext();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setServerError("");
    try {
      await login(data);
    } catch (err) {
      setServerError(
        err instanceof Error
          ? err.message
          : "Unable to sign in. Please try again.",
      );
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#eff6ff] to-[#f0fdf4] px-4">
      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="mb-8 flex justify-center">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2563eb]">
              <Stethoscope className="h-6 w-6 text-white" aria-hidden="true" />
            </div>
            <span className="text-xl font-medium">HealthCare Portal</span>
          </div>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>Sign in to your account</CardTitle>
            <CardDescription>
              Enter your credentials to access the portal
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              className="space-y-4"
            >
              {serverError && (
                <div
                  role="alert"
                  className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                >
                  {serverError}
                </div>
              )}

              <div>
                <label
                  htmlFor="login-email"
                  className="mb-2 block text-sm font-medium"
                >
                  Email address
                </label>
                <Input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  aria-invalid={!!errors.email}
                  aria-describedby={
                    errors.email ? "login-email-error" : undefined
                  }
                  {...register("email")}
                />
                {errors.email && (
                  <p
                    id="login-email-error"
                    role="alert"
                    className="mt-1 text-sm text-destructive"
                  >
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className="mb-2 block text-sm font-medium"
                >
                  Password
                </label>
                <Input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  aria-invalid={!!errors.password}
                  aria-describedby={
                    errors.password ? "login-password-error" : undefined
                  }
                  {...register("password")}
                />
                {errors.password && (
                  <p
                    id="login-password-error"
                    role="alert"
                    className="mt-1 text-sm text-destructive"
                  >
                    {errors.password.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Signing in…" : "Sign in"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={onNavigateToSignUp}
                className="text-[#2563eb] underline-offset-4 hover:underline"
              >
                Sign up
              </button>
            </p>

            {/* Dev helper — stripped in production builds */}
            {import.meta.env.DEV && (
              <div className="mt-6 rounded-md bg-accent/50 p-4 text-xs text-muted-foreground">
                <p className="mb-1 font-medium">Development accounts</p>
                <p>patient@example.com / Demo1234!</p>
                <p>admin@example.com / Demo1234!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
