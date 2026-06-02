"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useAppDispatch, useAppSelector } from "@/lib/redux/store";
import { closeSidebar } from "@/lib/redux/slices/uiSlice";
import { Home, FolderKanban, Users, Bell, BarChart3, Settings, CheckSquare, Activity, X } from "lucide-react";
import { Logo } from "./Logo";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils/cn";
import { useEffect } from "react";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/tasks", label: "My Tasks", icon: CheckSquare },
  { href: "/team", label: "Team", icon: Users, adminOnly: true },
  { href: "/activity", label: "Activity", icon: Activity },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function MobileSidebar() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const open = useAppSelector((s) => s.ui.sidebarOpen);
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";

  useEffect(() => { dispatch(closeSidebar()); }, [pathname, dispatch]);

  if (!open) return null;

  return (
    <div className="md:hidden fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/60 animate-fade-in" onClick={() => dispatch(closeSidebar())} />
      <aside className="relative w-72 bg-surface border-r border-border flex flex-col animate-slide-up">
        <div className="px-5 h-16 flex items-center justify-between border-b border-border">
          <Logo />
          <button onClick={() => dispatch(closeSidebar())} className="p-1.5 rounded-md text-muted-foreground hover:bg-muted" aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {items.map((item) => {
            if (item.adminOnly && !isAdmin) return null;
            const active = pathname === item.href || pathname?.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  active ? "bg-primary/10 text-primary" : "text-foreground/70 hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        {session?.user && (
          <div className="px-3 py-3 border-t border-border flex items-center gap-3">
            <Avatar name={session.user.name ?? "U"} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate">{session.user.name}</div>
              <div className="text-xs text-muted-foreground capitalize">{session.user.role}</div>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
