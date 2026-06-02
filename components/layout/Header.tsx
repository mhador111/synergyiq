"use client";

import { Menu, Bell, Search } from "lucide-react";
import Link from "next/link";
import { useAppDispatch } from "@/lib/redux/store";
import { toggleSidebar } from "@/lib/redux/slices/uiSlice";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "@/components/ui/Button";
import { useSession } from "next-auth/react";

export function Header() {
  const dispatch = useAppDispatch();
  const { data: session } = useSession();

  return (
    <header className="h-16 sticky top-0 z-30 bg-surface/80 backdrop-blur-md border-b border-border">
      <div className="h-full px-4 md:px-6 flex items-center gap-3">
        <button
          onClick={() => dispatch(toggleSidebar())}
          className="md:hidden p-2 -ml-2 rounded-md text-foreground/70 hover:text-foreground hover:bg-muted"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="md:hidden"><Logo /></div>

        <div className="flex-1 max-w-xl mx-2 hidden sm:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search projects, tasks…"
              className="w-full h-9 pl-9 pr-3 rounded-lg bg-muted/60 border border-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:bg-surface-elevated focus:border-border focus:ring-2 focus:ring-ring/20"
            />
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {session?.user && (
            <div className="hidden sm:flex items-center gap-2 mr-1">
              <div className="text-right leading-tight">
                <div className="text-sm font-medium text-foreground">{session.user.name}</div>
                <div className="text-xs text-muted-foreground capitalize">{session.user.role}</div>
              </div>
            </div>
          )}
          <Link href="/notifications" className="relative h-9 w-9 rounded-lg border border-border bg-surface-elevated flex items-center justify-center text-foreground/70 hover:text-foreground hover:bg-muted" aria-label="Notifications">
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
