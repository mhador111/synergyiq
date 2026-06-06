"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Menu, Search } from "lucide-react";
import { useAppDispatch } from "@/lib/redux/store";
import { toggleSidebar } from "@/lib/redux/slices/uiSlice";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationBell } from "./NotificationBell";
import { useSession } from "next-auth/react";

export function Header() {
  const dispatch = useAppDispatch();
  const { data: session } = useSession();
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);

  // Global keyboard shortcuts:
  //   Cmd/Ctrl + K  → focus the header search and go to /search
  //   Cmd/Ctrl + B  → toggle sidebar
  //   /             → focus the header search (when not typing in another field)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isMod = e.metaKey || e.ctrlKey;
      const tag = (e.target as HTMLElement | null)?.tagName;
      const inField =
        tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement | null)?.isContentEditable;

      if (isMod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
        return;
      }
      if (isMod && e.key.toLowerCase() === "b") {
        e.preventDefault();
        dispatch(toggleSidebar());
        return;
      }
      if (e.key === "/" && !inField && !isMod) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dispatch]);

  function onSearchSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = searchRef.current?.value.trim() ?? "";
    if (value.length === 0) return;
    router.push(`/search?q=${encodeURIComponent(value)}`);
  }

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

        <form
          onSubmit={onSearchSubmit}
          className="flex-1 max-w-xl mx-2 hidden sm:block"
          role="search"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              ref={searchRef}
              type="search"
              name="q"
              placeholder="Search projects, tasks…"
              aria-label="Search"
              className="w-full h-9 pl-9 pr-16 rounded-lg bg-muted/60 border border-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:bg-surface-elevated focus:border-border focus:ring-2 focus:ring-ring/20"
            />
            <kbd className="hidden md:inline-flex absolute right-2 top-1/2 -translate-y-1/2 h-5 items-center px-1.5 rounded border border-border bg-surface-elevated text-[10px] font-mono text-muted-foreground">
              ⌘K
            </kbd>
          </div>
        </form>

        <div className="ml-auto flex items-center gap-2">
          {session?.user && (
            <div className="hidden sm:flex items-center gap-2 mr-1">
              <div className="text-right leading-tight">
                <div className="text-sm font-medium text-foreground">{session.user.name}</div>
                <div className="text-xs text-muted-foreground capitalize">{session.user.role}</div>
              </div>
            </div>
          )}
          <NotificationBell />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
