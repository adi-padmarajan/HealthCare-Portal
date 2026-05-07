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
import { signUpSchema } from "@/lib/schemas/auth";
import type { SignUpFormValues } from "@/lib/schemas/auth";
import { Stethoscope } from "lucide-react";

import { useAuthContext } from "../context";

interface SignUpPageProps {
  onNavigateToLogin: () => void;
}

export function SignUpPage({ onNavigateToLogin }: SignUpPageProps) {
  const { signUp } = useAuthContext();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
  });

  const onSubmit = async (data: SignUpFormValues) => {
    setServerError("");
    try {
      await signUp(data);
    } catch (err) {
      setServerError(
        err instanceof Error
          ? err.message
          : "Unable to create account. Please try again.",
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
            <CardTitle>Create a patient account</CardTitle>
            <CardDescription>
              Sign up to book and manage your appointments
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
                  htmlFor="signup-name"
                  className="mb-2 block text-sm font-medium"
                >
                  Full name
                </label>
                <Input
                  id="signup-name"
                  type="text"
                  autoComplete="name"
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? "signup-name-error" : undefined}
                  {...register("name")}
                />
                {errors.name && (
                  <p
                    id="signup-name-error"
                    role="alert"
                    className="mt-1 text-sm text-destructive"
                  >
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="signup-email"
                  className="mb-2 block text-sm font-medium"
                >
                  Email address
                </label>
                <Input
                  id="signup-email"
                  type="email"
                  autoComplete="email"
                  aria-invalid={!!errors.email}
                  aria-describedby={
                    errors.email ? "signup-email-error" : undefined
                  }
                  {...register("email")}
                />
                {errors.email && (
                  <p
                    id="signup-email-error"
                    role="alert"
                    className="mt-1 text-sm text-destructive"
                  >
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="signup-password"
                  className="mb-2 block text-sm font-medium"
                >
                  Password
                </label>
                <Input
                  id="signup-password"
                  type="password"
                  autoComplete="new-password"
                  aria-invalid={!!errors.password}
                  aria-describedby={
                    errors.password ? "signup-password-error" : undefined
                  }
                  {...register("password")}
                />
                {errors.password && (
                  <p
                    id="signup-password-error"
                    role="alert"
                    className="mt-1 text-sm text-destructive"
                  >
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="signup-confirm"
                  className="mb-2 block text-sm font-medium"
                >
                  Confirm password
                </label>
                <Input
                  id="signup-confirm"
                  type="password"
                  autoComplete="new-password"
                  aria-invalid={!!errors.confirmPassword}
                  aria-describedby={
                    errors.confirmPassword
                      ? "signup-confirm-error"
                      : undefined
                  }
                  {...register("confirmPassword")}
                />
                {errors.confirmPassword && (
                  <p
                    id="signup-confirm-error"
                    role="alert"
                    className="mt-1 text-sm text-destructive"
                  >
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Creating account…" : "Create account"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <button
                type="button"
                onClick={onNavigateToLogin}
                className="text-[#2563eb] underline-offset-4 hover:underline"
              >
                Sign in
              </button>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
