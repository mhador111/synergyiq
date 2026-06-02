import Link from "next/link";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="px-6 py-4">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-primary-foreground" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 7h6M4 12h10M4 17h6" />
              <circle cx="17" cy="7" r="2" fill="currentColor" />
              <circle cx="19" cy="17" r="2" fill="currentColor" />
            </svg>
          </div>
          <span className="text-base font-semibold tracking-tight">SynergyIQ</span>
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">{children}</div>
      </main>
      <footer className="px-6 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} SynergyIQ
      </footer>
    </div>
  );
}
