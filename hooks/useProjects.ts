"use client";

import useSWR, { mutate } from "swr";
import { fetcher } from "@/lib/swr/fetcher";
import type { ProjectStatus, TaskPriority, TaskStatus } from "@/lib/auth/roles";

export interface ProjectListItem {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  deadline: string | null;
  ownerId: string;
  memberIds: string[];
  taskCount: number;
  completedCount: number;
  progress: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMember {
  id: string;
  name: string;
  email: string;
  role: "admin" | "manager" | "member";
  avatarColor: string;
}

export interface ProjectDetail {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  deadline: string | null;
  ownerId: string;
  memberIds: string[];
  owner: ProjectMember | null;
  members: ProjectMember[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectTask {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  projectId: string;
  assigneeId: string | null;
  createdBy: string;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserLite {
  id: string;
  name: string;
  email: string;
  role: "admin" | "manager" | "member";
  avatarColor: string;
}

export function useProjects() {
  const { data, error, isLoading, mutate: revalidate } = useSWR<{ projects: ProjectListItem[] }>(
    "/api/projects",
    fetcher,
    { revalidateOnFocus: false },
  );
  return {
    projects: data?.projects ?? [],
    error,
    isLoading,
    revalidate,
  };
}

export function useProject(id: string | null) {
  const { data, error, isLoading, mutate: revalidate } = useSWR<{ project: ProjectDetail; tasks: ProjectTask[] }>(
    id ? `/api/projects/${id}` : null,
    fetcher,
    { revalidateOnFocus: false },
  );
  return {
    project: data?.project,
    tasks: data?.tasks ?? [],
    error,
    isLoading,
    revalidate,
  };
}

export function useTasks(params: { mine?: boolean; projectId?: string; status?: TaskStatus } = {}) {
  const qs = new URLSearchParams();
  if (params.mine) qs.set("mine", "1");
  if (params.projectId) qs.set("projectId", params.projectId);
  if (params.status) qs.set("status", params.status);
  const url = `/api/tasks${qs.toString() ? `?${qs.toString()}` : ""}`;
  const { data, error, isLoading, mutate: revalidate } = useSWR<{ tasks: ProjectTask[] }>(
    url,
    fetcher,
    { revalidateOnFocus: false },
  );
  return {
    tasks: data?.tasks ?? [],
    error,
    isLoading,
    revalidate,
  };
}

export function useUsers() {
  const { data, error, isLoading } = useSWR<{ users: UserLite[] }>(
    "/api/users",
    fetcher,
    { revalidateOnFocus: false },
  );
  return {
    users: data?.users ?? [],
    error,
    isLoading,
  };
}

export async function revalidateProjects() {
  await mutate(
    (key) => typeof key === "string" && key.startsWith("/api/projects"),
    undefined,
    { revalidate: true },
  );
}
