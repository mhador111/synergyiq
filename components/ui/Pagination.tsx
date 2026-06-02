"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./Button";
import { cn } from "@/lib/utils/cn";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({ page, totalPages, onPageChange, className }: PaginationProps) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const visible = pages.filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1);

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Button variant="outline" size="icon" onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page === 1}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      {visible.map((p, idx) => {
        const prev = visible[idx - 1];
        const gap = prev && p - prev > 1;
        return (
          <div key={p} className="flex items-center gap-1">
            {gap && <span className="px-1 text-muted-foreground">…</span>}
            <Button
              variant={p === page ? "primary" : "ghost"}
              size="sm"
              onClick={() => onPageChange(p)}
              className="min-w-9"
            >
              {p}
            </Button>
          </div>
        );
      })}
      <Button variant="outline" size="icon" onClick={() => onPageChange(Math.min(totalPages, page + 1))} disabled={page === totalPages}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
