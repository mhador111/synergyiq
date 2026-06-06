"use client";

import useSWR, { mutate } from "swr";
import { useState } from "react";
import toast from "react-hot-toast";
import { fetcher } from "@/lib/swr/fetcher";

export interface CommentItem {
  id: string;
  taskId: string;
  body: string;
  authorId: string;
  authorName: string;
  authorColor: string;
  createdAt: string;
}

export function useComments(taskId: string | null) {
  const url = taskId ? `/api/tasks/${taskId}/comments` : null;
  const { data, error, isLoading, mutate: revalidate } = useSWR<{
    comments: CommentItem[];
  }>(url, fetcher, { revalidateOnFocus: false });
  return {
    comments: data?.comments ?? [],
    error,
    isLoading,
    revalidate,
  };
}

export function useAddComment(taskId: string) {
  const [isPending, setIsPending] = useState(false);

  async function submit(body: string) {
    if (!body.trim()) {
      toast.error("Comment cannot be empty");
      return false;
    }
    setIsPending(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: body.trim() }),
      });
      if (!res.ok) {
        const info = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(info.error ?? "Failed to post comment");
        return false;
      }
      await mutate(
        (key) =>
          typeof key === "string" && key.startsWith(`/api/tasks/${taskId}/comments`),
      );
      await mutate(
        (key) => typeof key === "string" && key.startsWith("/api/activity"),
      );
      toast.success("Comment posted");
      return true;
    } catch {
      toast.error("Network error");
      return false;
    } finally {
      setIsPending(false);
    }
  }

  return { submit, isPending };
}
