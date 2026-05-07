import * as React from "react";
import { cn } from "./utils";

interface ProgressStepsProps {
  steps: string[];
  currentStep: number;
}

export function ProgressSteps({ steps, currentStep }: ProgressStepsProps) {
  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={index}>
            <div className="flex flex-col items-center flex-1">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                  index < currentStep && "bg-[#2563eb] text-white",
                  index === currentStep && "bg-[#2563eb] text-white ring-4 ring-[#93c5fd]",
                  index > currentStep && "bg-muted text-muted-foreground"
                )}
              >
                {index + 1}
              </div>
              <span className={cn("mt-2 text-xs md:text-sm", index === currentStep ? "text-foreground" : "text-muted-foreground")}>
                {step}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={cn("flex-1 h-0.5 mx-2 -mt-12", index < currentStep ? "bg-[#2563eb]" : "bg-muted")} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
