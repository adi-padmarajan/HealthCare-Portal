import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { patientDetailsSchema, formatPhone } from "@/lib/schemas/booking";
import type { PatientDetailsFormValues } from "@/lib/schemas/booking";
import { insuranceProviders } from "@/services/mockData";
import type { PatientDetails } from "@/types";

interface StepPatientDetailsProps {
  details: PatientDetails;
  onChange: (details: PatientDetails) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepPatientDetails({ details, onChange, onNext, onBack }: StepPatientDetailsProps) {
  const {
    control,
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PatientDetailsFormValues>({
    resolver: zodResolver(patientDetailsSchema),
    defaultValues: details,
  });

  // Keep parent state in sync as fields change so StepReview can display them.
  const watched = watch();
  useEffect(() => {
    onChange(watched as PatientDetails);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(watched)]);

  const onSubmit = (_data: PatientDetailsFormValues) => {
    onNext();
  };

  const reasonLength = watch("reason")?.length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-2">Patient Details</h2>
        <p className="text-muted-foreground">
          Please provide your information for the appointment
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div>
          <label htmlFor="pd-fullName" className="mb-2 block">
            Full Name *
          </label>
          <Input
            id="pd-fullName"
            placeholder="John Doe"
            aria-invalid={!!errors.fullName}
            aria-describedby={errors.fullName ? "pd-fullName-error" : undefined}
            {...register("fullName")}
          />
          {errors.fullName && (
            <p id="pd-fullName-error" role="alert" className="mt-1 text-sm text-destructive">
              {errors.fullName.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="pd-dob" className="mb-2 block">
            Date of Birth *
          </label>
          <Input
            id="pd-dob"
            type="date"
            aria-invalid={!!errors.dateOfBirth}
            aria-describedby={errors.dateOfBirth ? "pd-dob-error" : undefined}
            {...register("dateOfBirth")}
          />
          {errors.dateOfBirth && (
            <p id="pd-dob-error" role="alert" className="mt-1 text-sm text-destructive">
              {errors.dateOfBirth.message}
            </p>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="pd-email" className="mb-2 block">
              Email *
            </label>
            <Input
              id="pd-email"
              type="email"
              placeholder="john.doe@email.com"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "pd-email-error" : undefined}
              {...register("email")}
            />
            {errors.email && (
              <p id="pd-email-error" role="alert" className="mt-1 text-sm text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="pd-phone" className="mb-2 block">
              Phone Number *
            </label>
            <Input
              id="pd-phone"
              type="tel"
              placeholder="(555) 123-4567"
              aria-invalid={!!errors.phone}
              aria-describedby={errors.phone ? "pd-phone-error" : undefined}
              {...register("phone", {
                onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                  setValue("phone", formatPhone(e.target.value), {
                    shouldValidate: true,
                  });
                },
              })}
            />
            {errors.phone && (
              <p id="pd-phone-error" role="alert" className="mt-1 text-sm text-destructive">
                {errors.phone.message}
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="pd-insurance" className="mb-2 block">
              Insurance Provider *
            </label>
            <Controller
              control={control}
              name="insurance"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    id="pd-insurance"
                    aria-invalid={!!errors.insurance}
                    aria-describedby={errors.insurance ? "pd-insurance-error" : undefined}
                  >
                    <SelectValue placeholder="Select insurance" />
                  </SelectTrigger>
                  <SelectContent>
                    {insuranceProviders.map((provider) => (
                      <SelectItem key={provider} value={provider}>
                        {provider}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.insurance && (
              <p id="pd-insurance-error" role="alert" className="mt-1 text-sm text-destructive">
                {errors.insurance.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="pd-memberId" className="mb-2 block">
              Insurance Member ID *
            </label>
            <Input
              id="pd-memberId"
              placeholder="BC123456789"
              aria-invalid={!!errors.insuranceMemberId}
              aria-describedby={
                errors.insuranceMemberId ? "pd-memberId-error" : undefined
              }
              {...register("insuranceMemberId")}
            />
            {errors.insuranceMemberId && (
              <p id="pd-memberId-error" role="alert" className="mt-1 text-sm text-destructive">
                {errors.insuranceMemberId.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label htmlFor="pd-reason">Reason for Visit *</label>
            <span
              className={`text-xs ${reasonLength > 500 ? "text-destructive" : "text-muted-foreground"}`}
              aria-live="polite"
            >
              {reasonLength}/500
            </span>
          </div>
          <Textarea
            id="pd-reason"
            placeholder="Please describe the reason for your visit..."
            rows={4}
            maxLength={500}
            aria-invalid={!!errors.reason}
            aria-describedby={errors.reason ? "pd-reason-error" : undefined}
            {...register("reason")}
          />
          {errors.reason && (
            <p id="pd-reason-error" role="alert" className="mt-1 text-sm text-destructive">
              {errors.reason.message}
            </p>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Controller
            control={control}
            name="isFirstTime"
            render={({ field }) => (
              <Checkbox
                id="pd-firstTime"
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked === true)}
              />
            )}
          />
          <label htmlFor="pd-firstTime" className="cursor-pointer text-sm">
            This is my first visit to this physician
          </label>
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onBack} className="flex-1">
            Back
          </Button>
          <Button type="submit" className="flex-1">
            Continue
          </Button>
        </div>
      </form>
    </div>
  );
}
