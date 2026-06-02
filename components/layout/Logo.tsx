import Link from "next/link";
import { cn } from "@/lib/utils/cn";

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2 group", className)}>
      <div className="relative h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-sm">
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-primary-foreground" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 7h6M4 12h10M4 17h6" />
          <circle cx="17" cy="7" r="2" fill="currentColor" />
          <circle cx="19" cy="17" r="2" fill="currentColor" />
        </svg>
      </div>
      {!compact && (
        <span className="text-base font-semibold text-foreground tracking-tight">SynergyIQ</span>
      )}
    </Link>
  );
}
