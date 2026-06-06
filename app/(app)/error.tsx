"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertOctagon, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[SynergyIQ] App error:", error);
  }, [error]);

  return (
    <div className="space-y-4 max-w-xl mx-auto mt-12 text-center">
      <div className="mx-auto h-12 w-12 rounded-full bg-danger/10 text-danger flex items-center justify-center">
        <AlertOctagon className="h-6 w-6" />
      </div>
      <h1 className="text-2xl font-semibold">This page failed to load</h1>
      <p className="text-sm text-muted-foreground">
        Something broke while fetching this view. Try again, or head back to the dashboard.
      </p>
      {error.digest && (
        <p className="text-xs text-muted-foreground/70 font-mono break-all">
          ref: {error.digest}
        </p>
      )}
      <div className="flex items-center justify-center gap-2">
        <Button onClick={() => reset()} leftIcon={<RefreshCcw className="h-4 w-4" />}>
          Try again
        </Button>
        <Link href="/dashboard">
          <Button variant="outline">Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
