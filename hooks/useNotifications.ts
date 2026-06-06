"use client";

import useSWR, { mutate } from "swr";
import { useCallback } from "react";
import toast from "react-hot-toast";
import { fetcher } from "@/lib/swr/fetcher";

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

interface NotificationsResponse {
  notifications: NotificationItem[];
  unreadCount: number;
}

const ENDPOINT = "/api/notifications";

export function useNotifications() {
  const { data, error, isLoading, mutate: revalidate } = useSWR<NotificationsResponse>(
    ENDPOINT,
    fetcher,
    {
      revalidateOnFocus: false,
      refreshInterval: 30_000, // light polling — every 30s
    },
  );

  const markRead = useCallback(
    async (id: string) => {
      // Optimistic update
      await mutate(
        ENDPOINT,
        async (current?: NotificationsResponse) => {
          if (!current) return current;
          return {
            notifications: current.notifications.map((n) =>
              n.id === id ? { ...n, read: true } : n,
            ),
            unreadCount: Math.max(0, current.unreadCount - 1),
          };
        },
        { revalidate: false, populateCache: true, rollbackOnError: true },
      );
      try {
        const res = await fetch(ENDPOINT, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
        if (!res.ok) throw new Error("Failed");
      } catch {
        toast.error("Could not mark notification as read");
        await mutate(ENDPOINT);
      }
    },
    [],
  );

  const markAllRead = useCallback(async () => {
    await mutate(
      ENDPOINT,
      async (current?: NotificationsResponse) => {
        if (!current) return current;
        return {
          notifications: current.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        };
      },
      { revalidate: false, populateCache: true, rollbackOnError: true },
    );
    try {
      const res = await fetch(ENDPOINT, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Could not mark all as read");
      await mutate(ENDPOINT);
    }
  }, []);

  return {
    notifications: data?.notifications ?? [],
    unreadCount: data?.unreadCount ?? 0,
    error,
    isLoading,
    revalidate,
    markRead,
    markAllRead,
  };
}
