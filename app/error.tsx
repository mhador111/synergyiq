"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertOctagon, RefreshCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to console — wire to Sentry/Datadog in a real deploy
    console.error("[SynergyIQ] Unhandled error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-background text-foreground">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="mx-auto h-12 w-12 rounded-full bg-danger/10 text-danger flex items-center justify-center">
          <AlertOctagon className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-semibold">Something went wrong</h1>
        <p className="text-sm text-muted-foreground">
          An unexpected error occurred. The team has been notified. You can try again, or head back home.
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground/70 font-mono break-all">
            ref: {error.digest}
          </p>
        )}
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button onClick={() => reset()} leftIcon={<RefreshCcw className="h-4 w-4" />}>
            Try again
          </Button>
          <Link href="/">
            <Button variant="outline" leftIcon={<Home className="h-4 w-4" />}>
              Go home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
