"use client";

import useSWR, { mutate } from "swr";
import { useCallback } from "react";
import toast from "react-hot-toast";
import { fetcher } from "@/lib/swr/fetcher";
import type { Role } from "@/lib/models/user";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarColor: string;
  createdAt: string;
  lastActiveAt: string | null;
  isActive: boolean;
  openTasks: number;
  completedTasks: number;
  projectCount: number;
}

const ENDPOINT = "/api/users";

export function useTeam() {
  const { data, error, isLoading, mutate: revalidate } = useSWR<{ users: TeamMember[] }>(
    ENDPOINT,
    fetcher,
    { revalidateOnFocus: false },
  );

  const changeRole = useCallback(
    async (userId: string, newRole: Role) => {
      const previous = data;
      // Optimistic update
      await mutate<{ users: TeamMember[] }>(
        ENDPOINT,
        async (current) => {
          if (!current) return current;
          return {
            users: current.users.map((u: TeamMember) =>
              u.id === userId ? { ...u, role: newRole } : u,
            ),
          };
        },
        { revalidate: false, populateCache: true, rollbackOnError: true },
      );
      try {
        const res = await fetch(`/api/users/${userId}/role`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: newRole }),
        });
        if (!res.ok) {
          const info = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(info?.error ?? "Failed to change role");
        }
        toast.success("Role updated");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to change role");
        await mutate(ENDPOINT, previous, { revalidate: false });
      }
    },
    [data],
  );

  return {
    members: data?.users ?? [],
    error,
    isLoading,
    revalidate,
    changeRole,
  };
}
