"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/swr/fetcher";

export interface SearchProjectHit {
  id: string;
  name: string;
  description: string;
  status: string;
}

export interface SearchTaskHit {
  id: string;
  title: string;
  status: string;
  priority: string;
  projectId: string;
  projectName: string | null;
}

export interface SearchCommentHit {
  id: string;
  body: string;
  taskId: string;
  createdAt: string;
}

export interface SearchUserHit {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarColor: string;
}

export interface SearchResults {
  q: string;
  projects: SearchProjectHit[];
  tasks: SearchTaskHit[];
  comments: SearchCommentHit[];
  users: SearchUserHit[];
}

export function useSearch(query: string) {
  const trimmed = query.trim();
  const url = trimmed.length >= 2 ? `/api/search?q=${encodeURIComponent(trimmed)}` : null;
  const { data, error, isLoading } = useSWR<SearchResults>(
    url,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 1000 },
  );
  return {
    results: data,
    error,
    isLoading: Boolean(url) && isLoading,
  };
}
