"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/swr/fetcher";

export interface AnalyticsTasksByStatus {
  todo: number;
  in_progress: number;
  completed: number;
}

export interface AnalyticsTasksByPriority {
  high: number;
  medium: number;
  low: number;
}

export interface AnalyticsProjectProgress {
  id: string;
  name: string;
  status: string;
  total: number;
  done: number;
  progress: number;
}

export interface AnalyticsActivityByDay {
  date: string;
  count: number;
  label: string;
}

export interface AnalyticsData {
  tasksByStatus: AnalyticsTasksByStatus;
  tasksByPriority: AnalyticsTasksByPriority;
  projectProgress: AnalyticsProjectProgress[];
  activityByDay: AnalyticsActivityByDay[];
}

export function useAnalytics() {
  const { data, error, isLoading } = useSWR<AnalyticsData>(
    "/api/analytics",
    fetcher,
    { revalidateOnFocus: false },
  );
  return {
    data,
    error,
    isLoading,
  };
}
