import { useState } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Checkbox } from "../../components/ui/checkbox";
import { insuranceProviders } from "../../data/mockData";
import type { PatientDetails } from "@/types";

interface StepPatientDetailsProps {
  details: PatientDetails;
  onChange: (details: PatientDetails) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepPatientDetails({ details, onChange, onNext, onBack }: StepPatientDetailsProps) {
  const [errors, setErrors] = useState<Partial<Record<keyof PatientDetails, string>>>({});

  const validateForm = () => {
    const newErrors: Partial<Record<keyof PatientDetails, string>> = {};

    if (!details.fullName.trim()) newErrors.fullName = "Full name is required";
    if (!details.dateOfBirth) newErrors.dateOfBirth = "Date of birth is required";
    if (!details.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email)) {
      newErrors.email = "Please enter a valid email";
    }
    if (!details.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\(\d{3}\)\s\d{3}-\d{4}$/.test(details.phone) && !/^\d{10}$/.test(details.phone.replace(/\D/g, ""))) {
      newErrors.phone = "Please enter a valid phone number";
    }
    if (!details.insurance) newErrors.insurance = "Insurance provider is required";
    if (!details.insuranceMemberId.trim()) newErrors.insuranceMemberId = "Member ID is required";
    if (!details.reason.trim()) newErrors.reason = "Reason for visit is required";
    if (details.reason.length > 500) newErrors.reason = "Reason must be 500 characters or less";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onNext();
    }
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-2">Patient Details</h2>
        <p className="text-muted-foreground">Please provide your information for the appointment</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-2 block">Full Name *</label>
          <Input
            placeholder="John Doe"
            value={details.fullName}
            onChange={(e) => onChange({ ...details, fullName: e.target.value })}
            error={errors.fullName}
          />
        </div>

        <div>
          <label className="mb-2 block">Date of Birth *</label>
          <Input
            type="date"
            value={details.dateOfBirth}
            onChange={(e) => onChange({ ...details, dateOfBirth: e.target.value })}
            error={errors.dateOfBirth}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block">Email *</label>
            <Input
              type="email"
              placeholder="john.doe@email.com"
              value={details.email}
              onChange={(e) => onChange({ ...details, email: e.target.value })}
              error={errors.email}
            />
          </div>

          <div>
            <label className="mb-2 block">Phone Number *</label>
            <Input
              type="tel"
              placeholder="(555) 123-4567"
              value={details.phone}
              onChange={(e) => onChange({ ...details, phone: formatPhone(e.target.value) })}
              error={errors.phone}
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block">Insurance Provider *</label>
            <Select value={details.insurance} onValueChange={(value) => onChange({ ...details, insurance: value })}>
              <SelectTrigger>
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
            {errors.insurance && <p className="mt-1 text-sm text-destructive">{errors.insurance}</p>}
          </div>

          <div>
            <label className="mb-2 block">Insurance Member ID *</label>
            <Input
              placeholder="BC123456789"
              value={details.insuranceMemberId}
              onChange={(e) => onChange({ ...details, insuranceMemberId: e.target.value })}
              error={errors.insuranceMemberId}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label>Reason for Visit *</label>
            <span className={`text-xs ${details.reason.length > 500 ? "text-destructive" : "text-muted-foreground"}`}>
              {details.reason.length}/500
            </span>
          </div>
          <Textarea
            placeholder="Please describe the reason for your visit..."
            value={details.reason}
            onChange={(e) => onChange({ ...details, reason: e.target.value })}
            error={errors.reason}
            rows={4}
            maxLength={500}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox id="firstTime" checked={details.isFirstTime} onCheckedChange={(checked) => onChange({ ...details, isFirstTime: checked === true })} />
          <label htmlFor="firstTime" className="text-sm cursor-pointer">
            This is my first visit to this physician
          </label>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button onClick={handleSubmit} className="flex-1">
          Continue
        </Button>
      </div>
    </div>
  );
}
