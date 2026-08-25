"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-6 text-center">
      <AlertTriangle className="h-8 w-8 text-clay-600" />
      <p className="font-serif-display text-lg font-medium text-forest-900">Something went wrong loading this page</p>
      <p className="max-w-sm text-sm text-ink-500">
        Your data is safe — this was a display error, not a data-loss one. Try again, and if it persists, check the audit log in Settings.
      </p>
      <Button onClick={reset} variant="outline" size="sm">
        Try again
      </Button>
    </div>
  );
}
