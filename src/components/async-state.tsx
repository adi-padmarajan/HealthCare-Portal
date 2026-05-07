import { AlertCircle, CalendarX, Loader2 } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface LoadingStateProps {
  framed?: boolean;
  message?: string;
}

interface EmptyStateProps {
  action?: ReactNode;
  description?: string;
  framed?: boolean;
  title: string;
}

interface ErrorStateProps {
  framed?: boolean;
  message?: string;
  onRetry?: () => void;
  title?: string;
}

function StateShell({ children, framed }: { children: ReactNode; framed: boolean }) {
  if (!framed) {
    return <div className="p-8 text-center">{children}</div>;
  }

  return (
    <Card>
      <CardContent className="p-8 text-center">{children}</CardContent>
    </Card>
  );
}

export function LoadingState({ framed = true, message = "Loading..." }: LoadingStateProps) {
  return (
    <StateShell framed={framed}>
      <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        <span>{message}</span>
      </div>
    </StateShell>
  );
}

export function EmptyState({ action, description, framed = true, title }: EmptyStateProps) {
  return (
    <StateShell framed={framed}>
      <CalendarX className="mx-auto mb-4 h-12 w-12 text-muted-foreground" aria-hidden="true" />
      <h3 className="mb-2">{title}</h3>
      {description && <p className="mb-6 text-muted-foreground">{description}</p>}
      {action}
    </StateShell>
  );
}

export function ErrorState({
  framed = true,
  message = "Please try again. No appointment details are included in this error.",
  onRetry,
  title = "Unable to load this information",
}: ErrorStateProps) {
  return (
    <StateShell framed={framed}>
      <AlertCircle className="mx-auto mb-4 h-10 w-10 text-destructive" aria-hidden="true" />
      <h3 className="mb-2">{title}</h3>
      <p className="mx-auto mb-6 max-w-md text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </StateShell>
  );
}
