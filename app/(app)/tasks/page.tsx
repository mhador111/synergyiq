"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CheckSquare, Calendar, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useTasks, useProjects, type ProjectTask } from "@/hooks/useProjects";
import { updateTaskStatus } from "@/actions/tasks";
import { TASK_STATUSES, type TaskStatus } from "@/lib/auth/roles";
import { isOverdue, isUpcoming, formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import toast from "react-hot-toast";

const statusLabel: Record<TaskStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  completed: "Completed",
};

const priorityVariant = {
  high: "danger",
  medium: "warning",
  low: "muted",
} as const;

const nextStatus: Record<TaskStatus, TaskStatus | null> = {
  todo: "in_progress",
  in_progress: "completed",
  completed: null,
};

const columns: { status: TaskStatus; accent: string }[] = [
  { status: "todo", accent: "border-t-muted-foreground/40" },
  { status: "in_progress", accent: "border-t-warning" },
  { status: "completed", accent: "border-t-success" },
];

export default function MyTasksPage() {
  const { tasks, isLoading, revalidate } = useTasks({ mine: true });
  const { projects } = useProjects();
  const [pending, setPending] = useState<string | null>(null);

  const projectMap = useMemo(() => {
    const m = new Map<string, { name: string; id: string }>();
    for (const p of projects) m.set(p.id, { name: p.name, id: p.id });
    return m;
  }, [projects]);

  const grouped = useMemo(() => {
    const g: Record<TaskStatus, ProjectTask[]> = {
      todo: [],
      in_progress: [],
      completed: [],
    };
    for (const t of tasks) g[t.status].push(t);
    return g;
  }, [tasks]);

  const counts = useMemo(() => {
    return {
      total: tasks.length,
      open: tasks.filter((t) => t.status !== "completed").length,
      done: tasks.filter((t) => t.status === "completed").length,
      overdue: tasks.filter(
        (t) => t.status !== "completed" && isOverdue(t.dueDate),
      ).length,
    };
  }, [tasks]);

  async function advance(task: ProjectTask) {
    const next = nextStatus[task.status];
    if (!next) return;
    setPending(task.id);
    const res = await updateTaskStatus({ id: task.id, status: next });
    setPending(null);
    if (res.ok) {
      toast.success(`Moved to "${statusLabel[next]}"`);
      await revalidate();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Tasks"
        description="Everything assigned to you, grouped by status."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total" value={counts.total} />
        <StatCard label="Open" value={counts.open} accent="text-primary" />
        <StatCard label="Completed" value={counts.done} accent="text-success" />
        <StatCard label="Overdue" value={counts.overdue} accent="text-danger" />
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-3 gap-4">
          {TASK_STATUSES.map((s) => (
            <div key={s} className="rounded-lg border border-border bg-surface-elevated p-4 space-y-3">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface-elevated">
          <EmptyState
            icon={<CheckSquare className="h-8 w-8" />}
            title="No tasks assigned to you"
            description="When teammates assign you to a task, it'll show up here."
          />
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          {columns.map(({ status, accent }) => (
            <div
              key={status}
              className={cn(
                "rounded-lg border-t-2 border border-border bg-surface-elevated",
                accent,
              )}
            >
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold text-foreground">
                  {statusLabel[status]}
                </h3>
                <Badge variant="muted">{grouped[status].length}</Badge>
              </div>
              <ul className="divide-y divide-border">
                {grouped[status].length === 0 ? (
                  <li className="px-4 py-6 text-center text-xs text-muted-foreground">
                    Nothing here.
                  </li>
                ) : (
                  grouped[status].map((task) => {
                    const project = projectMap.get(task.projectId);
                    const overdue =
                      task.status !== "completed" && isOverdue(task.dueDate);
                    const dueSoon =
                      task.status !== "completed" &&
                      !overdue &&
                      isUpcoming(task.dueDate);
                    return (
                      <li key={task.id} className="px-4 py-3 group">
                        <div className="flex items-start gap-2">
                          <div className="min-w-0 flex-1">
                            <Link
                              href={`/projects/${task.projectId}?taskId=${task.id}`}
                              className="block font-medium text-sm text-foreground hover:text-primary transition-colors line-clamp-2"
                            >
                              {task.title}
                            </Link>
                            <div className="mt-1.5 flex items-center gap-2 flex-wrap text-xs">
                              <Badge variant={priorityVariant[task.priority]}>
                                {task.priority}
                              </Badge>
                              {project && (
                                <Link
                                  href={`/projects/${project.id}`}
                                  className="text-muted-foreground hover:text-foreground transition-colors"
                                >
                                  {project.name}
                                </Link>
                              )}
                              {task.dueDate && (
                                <span
                                  className={cn(
                                    "inline-flex items-center gap-1",
                                    overdue
                                      ? "text-danger"
                                      : dueSoon
                                        ? "text-warning"
                                        : "text-muted-foreground",
                                  )}
                                >
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(task.dueDate)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {nextStatus[task.status] && (
                          <button
                            type="button"
                            onClick={() => advance(task)}
                            disabled={pending === task.id}
                            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline disabled:opacity-50"
                          >
                            {pending === task.id ? (
                              "Moving…"
                            ) : (
                              <>
                                Move to {statusLabel[nextStatus[task.status]!]}
                                <ArrowRight className="h-3 w-3" />
                              </>
                            )}
                          </button>
                        )}
                      </li>
                    );
                  })
                )}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <Card className="px-4 py-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={cn("text-2xl font-semibold mt-0.5", accent ?? "text-foreground")}>
        {value}
      </div>
    </Card>
  );
}
