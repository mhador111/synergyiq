"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, Check, Inbox } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useNotifications, type NotificationItem } from "@/hooks/useNotifications";
import { timeAgo } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

function NotificationRow({
  n,
  onClick,
}: {
  n: NotificationItem;
  onClick: () => void;
}) {
  const inner = (
    <div className="flex gap-3 items-start">
      <span
        className={cn(
          "mt-1.5 h-2 w-2 shrink-0 rounded-full",
          n.read ? "bg-transparent" : "bg-primary",
        )}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm",
            n.read ? "text-foreground/80" : "font-semibold text-foreground",
          )}
        >
          {n.title}
        </p>
        {n.body && (
          <p className="text-sm text-muted-foreground mt-0.5 break-words">{n.body}</p>
        )}
        <p className="text-xs text-muted-foreground/80 mt-1">{timeAgo(n.createdAt)}</p>
      </div>
    </div>
  );

  const className = cn(
    "block px-4 py-3 border-b border-border last:border-0 hover:bg-muted transition-colors",
    !n.read && "bg-primary/5",
  );

  if (n.link) {
    return (
      <Link href={n.link} onClick={onClick} className={className}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cn(className, "w-full text-left")}>
      {inner}
    </button>
  );
}

export default function NotificationsPage() {
  const { notifications, unreadCount, isLoading, markRead, markAllRead, revalidate } =
    useNotifications();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const visible =
    filter === "unread" ? notifications.filter((n) => !n.read) : notifications;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <PageHeader
        title="Notifications"
        description={
          unreadCount > 0
            ? `You have ${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}.`
            : "You're all caught up."
        }
        actions={
          <Button
            onClick={() => markAllRead()}
            disabled={unreadCount === 0}
            variant="secondary"
            leftIcon={<Check className="h-4 w-4" />}
          >
            Mark all as read
          </Button>
        }
      />

      <div className="flex items-center justify-between border-b border-border">
        <div className="flex gap-1">
          <FilterTab active={filter === "all"} onClick={() => setFilter("all")}>
            All <span className="ml-1 text-xs text-muted-foreground">{notifications.length}</span>
          </FilterTab>
          <FilterTab
            active={filter === "unread"}
            onClick={() => setFilter("unread")}
            disabled={unreadCount === 0}
          >
            Unread <span className="ml-1 text-xs text-muted-foreground">{unreadCount}</span>
          </FilterTab>
        </div>
        <button
          onClick={() => revalidate()}
          className="text-xs text-muted-foreground hover:text-foreground mb-2"
        >
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border p-4">
              <Skeleton className="h-4 w-2/3 mb-2" />
              <Skeleton className="h-3 w-full mb-1" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface-elevated">
          <EmptyState
            icon={<Inbox className="h-8 w-8" />}
            title={filter === "unread" ? "No unread notifications" : "No notifications yet"}
            description={
              filter === "unread"
                ? "Switch to All to see your read notifications."
                : "We'll let you know when something happens — new tasks, assignments, comments, and more."
            }
          />
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-surface-elevated overflow-hidden">
          {visible.map((n) => (
            <NotificationRow
              key={n.id}
              n={n}
              onClick={() => {
                if (!n.read) markRead(n.id);
              }}
            />
          ))}
        </div>
      )}

      <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground pt-2">
        <Bell className="h-3 w-3" /> Auto-refreshes every 30 seconds
      </div>
    </div>
  );
}

function FilterTab({
  active,
  onClick,
  disabled,
  children,
}: {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
        active
          ? "border-primary text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground",
        disabled && "opacity-50 cursor-not-allowed hover:text-muted-foreground",
      )}
    >
      {children}
    </button>
  );
}
