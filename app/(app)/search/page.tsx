"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Search as SearchIcon, FolderKanban, CheckSquare, MessageSquare, User, X } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { useDebounce } from "@/hooks/useDebounce";
import { useSearch } from "@/hooks/useSearch";
import { cn } from "@/lib/utils/cn";

const statusVariant = {
  active: "success",
  completed: "muted",
  on_hold: "warning",
} as const;

const taskStatusVariant = {
  todo: "muted",
  in_progress: "warning",
  completed: "success",
} as const;

const priorityVariant = {
  high: "danger",
  medium: "warning",
  low: "muted",
} as const;

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const debounced = useDebounce(q, 250);
  const { results, isLoading } = useSearch(debounced);

  // Keep the URL in sync with the search query (shallow replace, no scroll)
  useEffect(() => {
    const next = debounced.trim();
    const current = searchParams.get("q") ?? "";
    if (next === current) return;
    const params = new URLSearchParams(searchParams.toString());
    if (next) params.set("q", next);
    else params.delete("q");
    const url = params.toString() ? `/search?${params.toString()}` : "/search";
    router.replace(url, { scroll: false });
  }, [debounced, router, searchParams]);

  const totalCount = results
    ? results.projects.length +
      results.tasks.length +
      results.comments.length +
      results.users.length
    : 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Search"
        description="Find projects, tasks, comments, and people across your workspace."
      />

      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Type at least 2 characters…"
          className="pl-9 pr-9"
          autoFocus
        />
        {q && (
          <button
            type="button"
            onClick={() => setQ("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {!results && !isLoading && debounced.length < 2 ? (
        <div className="rounded-lg border border-border bg-surface-elevated">
          <EmptyState
            icon={<SearchIcon className="h-8 w-8" />}
            title="Start typing to search"
            description="Results are limited to projects you have access to."
          />
        </div>
      ) : isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : results && totalCount === 0 ? (
        <div className="rounded-lg border border-border bg-surface-elevated">
          <EmptyState
            icon={<SearchIcon className="h-8 w-8" />}
            title={`No results for "${results.q}"`}
            description="Try a different search term, or check your spelling."
          />
        </div>
      ) : (
        results && (
          <div className="space-y-4">
            <div className="text-xs text-muted-foreground">
              {totalCount} result{totalCount === 1 ? "" : "s"} for{" "}
              <span className="text-foreground font-medium">"{results.q}"</span>
            </div>

            {results.projects.length > 0 && (
              <ResultGroup
                title="Projects"
                count={results.projects.length}
                icon={<FolderKanban className="h-4 w-4" />}
              >
                {results.projects.map((p) => (
                  <Link
                    key={p.id}
                    href={`/projects/${p.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors"
                  >
                    <FolderKanban className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-foreground truncate">
                        {p.name}
                      </div>
                      {p.description && (
                        <div className="text-xs text-muted-foreground truncate">
                          {p.description}
                        </div>
                      )}
                    </div>
                    <Badge variant={statusVariant[p.status as keyof typeof statusVariant] ?? "muted"}>
                      {p.status}
                    </Badge>
                  </Link>
                ))}
              </ResultGroup>
            )}

            {results.tasks.length > 0 && (
              <ResultGroup
                title="Tasks"
                count={results.tasks.length}
                icon={<CheckSquare className="h-4 w-4" />}
              >
                {results.tasks.map((t) => (
                  <Link
                    key={t.id}
                    href={`/projects/${t.projectId}?taskId=${t.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors"
                  >
                    <CheckSquare className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-foreground truncate">
                        {t.title}
                      </div>
                      {t.projectName && (
                        <div className="text-xs text-muted-foreground">
                          in {t.projectName}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge variant={taskStatusVariant[t.status as keyof typeof taskStatusVariant] ?? "muted"}>
                        {t.status.replace("_", " ")}
                      </Badge>
                      <Badge variant={priorityVariant[t.priority as keyof typeof priorityVariant] ?? "muted"}>
                        {t.priority}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </ResultGroup>
            )}

            {results.comments.length > 0 && (
              <ResultGroup
                title="Comments"
                count={results.comments.length}
                icon={<MessageSquare className="h-4 w-4" />}
              >
                {results.comments.map((c) => (
                  <Link
                    key={c.id}
                    href={`/projects?taskId=${c.taskId}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors"
                  >
                    <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0 flex-1 text-sm text-foreground line-clamp-2">
                      {c.body}
                    </div>
                  </Link>
                ))}
              </ResultGroup>
            )}

            {results.users.length > 0 && (
              <ResultGroup
                title="People"
                count={results.users.length}
                icon={<User className="h-4 w-4" />}
              >
                {results.users.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <Avatar name={u.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-foreground truncate">
                        {u.name}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {u.email}
                      </div>
                    </div>
                    <Badge variant="muted" className="capitalize">{u.role}</Badge>
                  </div>
                ))}
              </ResultGroup>
            )}
          </div>
        )
      )}
    </div>
  );
}

function ResultGroup({
  title,
  count,
  icon,
  children,
}: {
  title: string;
  count: number;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden">
      <div className={cn(
        "flex items-center gap-2 px-4 py-2 border-b border-border bg-muted/40 text-sm font-semibold text-foreground",
      )}>
        {icon}
        <span>{title}</span>
        <Badge variant="muted">{count}</Badge>
      </div>
      <div className="divide-y divide-border">{children}</div>
    </Card>
  );
}
