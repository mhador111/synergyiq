"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Home, FolderKanban, Users, Bell, BarChart3, Settings, LogOut, CheckSquare, Activity, Search } from "lucide-react";
import { Logo } from "./Logo";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils/cn";
import { useNotifications } from "@/hooks/useNotifications";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/tasks", label: "My Tasks", icon: CheckSquare },
  { href: "/team", label: "Team", icon: Users, adminOnly: true },
  { href: "/activity", label: "Activity", icon: Activity },
  { href: "/search", label: "Search", icon: Search },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

const footerItems = [
  { href: "/notifications", label: "Notifications", icon: Bell },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { unreadCount } = useNotifications();
  const role = session?.user?.role ?? "member";
  const isAdmin = role === "admin";

  function handleSignOut() {
    signOut({ callbackUrl: "/login" });
  }

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:border-r md:border-border md:bg-surface h-screen sticky top-0">
      <div className="px-5 h-16 flex items-center border-b border-border">
        <Logo />
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
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.label === "Notifications" && unreadCount > 0 && (
                <span
                  className={cn(
                    "min-w-[1.25rem] h-5 px-1.5 rounded-full text-[10px] font-semibold flex items-center justify-center",
                    "bg-primary text-primary-foreground",
                  )}
                  aria-label={`${unreadCount} unread`}
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-3 border-t border-border space-y-0.5">
        {footerItems.map((item) => {
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
              <span className="flex-1">{item.label}</span>
              {item.label === "Notifications" && unreadCount > 0 && (
                <span
                  className={cn(
                    "min-w-[1.25rem] h-5 px-1.5 rounded-full text-[10px] font-semibold flex items-center justify-center",
                    "bg-primary text-primary-foreground",
                  )}
                  aria-label={`${unreadCount} unread`}
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>
          );
        })}

        {session?.user && (
          <div className="mt-3 pt-3 border-t border-border flex items-center gap-3 px-2 py-2 rounded-lg">
            <Avatar name={session.user.name ?? "U"} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-foreground truncate">{session.user.name}</div>
              <div className="text-xs text-muted-foreground capitalize">{role}</div>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="text-muted-foreground hover:text-foreground p-1.5 rounded-md hover:bg-muted"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
