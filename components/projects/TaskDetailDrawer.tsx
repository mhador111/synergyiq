"use client";

import { useEffect, useRef, useState } from "react";
import {
  Calendar,
  Flag,
  MessageCircle,
  Send,
  UserCircle2,
  X,
} from "lucide-react";

import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAddComment, useComments } from "@/hooks/useComments";
import type { ProjectMember, ProjectTask } from "@/hooks/useProjects";
import { cn } from "@/lib/utils/cn";
import {
  formatDate,
  isOverdue,
  isUpcoming,
  timeAgo,
} from "@/lib/utils/format";
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/auth/roles";

const statusLabel: Record<TaskStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  completed: "Done",
};

const priorityVariant: Record<TaskPriority, "danger" | "warning" | "neutral"> = {
  high: "danger",
  medium: "warning",
  low: "neutral",
};

const priorityLabel: Record<TaskPriority, string> = {
  high: "High priority",
  medium: "Medium priority",
  low: "Low priority",
};

interface TaskDetailDrawerProps {
  task: ProjectTask | null;
  members: ProjectMember[];
  onClose: () => void;
  onEdit: (task: ProjectTask) => void;
  onAssign: (task: ProjectTask) => void;
  canManageMembers: boolean;
}

export function TaskDetailDrawer({
  task,
  members,
  onClose,
  onEdit,
  onAssign,
  canManageMembers,
}: TaskDetailDrawerProps) {
  const open = task !== null;
  const taskId = task?.id ?? null;
  const membersById = new Map(members.map((m) => [m.id, m]));
  const assignee = task?.assigneeId ? membersById.get(task.assigneeId) : null;
  const creator = task ? membersById.get(task.createdBy) : null;

  const { comments, isLoading: commentsLoading, revalidate: revalidateComments } =
    useComments(taskId);
  const { submit: postComment, isPending: postingComment } = useAddComment(
    taskId ?? "",
  );

  const [draft, setDraft] = useState("");
  const draftRef = useRef<HTMLTextAreaElement | null>(null);
  const commentsEndRef = useRef<HTMLDivElement | null>(null);

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onEsc);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onEsc);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  // Reset draft + scroll to bottom when switching tasks
  useEffect(() => {
    setDraft("");
    if (open) {
      // Allow the drawer to mount before scrolling
      const t = window.setTimeout(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 50);
      return () => window.clearTimeout(t);
    }
  }, [taskId, open]);

  // Auto-grow the textarea as the user types
  useEffect(() => {
    const el = draftRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, [draft]);

  async function handleSubmit() {
    if (!draft.trim() || !taskId) return;
    const ok = await postComment(draft);
    if (ok) {
      setDraft("");
      // Re-fetch authoritative list and scroll to bottom
      await revalidateComments();
      window.setTimeout(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      void handleSubmit();
    }
  }

  const overdueFlag = task?.dueDate ? isOverdue(task.dueDate) : false;
  const upcomingFlag = task?.dueDate ? isUpcoming(task.dueDate, 3) : false;

  return (
    <div
      aria-hidden={!open}
      className={cn(
        "fixed inset-0 z-50 transition-opacity duration-200",
        open
          ? "pointer-events-auto opacity-100"
          : "pointer-events-none opacity-0",
      )}
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close task details"
        onClick={onClose}
        className="absolute inset-0 bg-black/60"
      />

      {/* Drawer panel */}
      <aside
        role="dialog"
        aria-modal
        aria-label="Task details"
        className={cn(
          "absolute top-0 right-0 h-full w-full sm:w-[480px] bg-surface-elevated border-l border-border shadow-2xl",
          "flex flex-col transition-transform duration-200 ease-out",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        {task && (
          <>
            <header className="flex items-start justify-between gap-3 px-5 py-4 border-b border-border">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <Badge
                    variant={
                      task.status === "completed" ? "success" : "primary"
                    }
                  >
                    {statusLabel[task.status]}
                  </Badge>
                  <Badge variant={priorityVariant[task.priority]}>
                    <Flag className="h-3 w-3" /> {priorityLabel[task.priority]}
                  </Badge>
                </div>
                <h2 className="text-lg font-semibold text-foreground line-clamp-2">
                  {task.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  Details
                </h3>
                <dl className="space-y-3 text-sm">
                  <DetailRow
                    icon={<Calendar className="h-4 w-4" />}
                    label="Due date"
                    tone={
                      overdueFlag
                        ? "danger"
                        : upcomingFlag
                          ? "warning"
                          : "default"
                    }
                    value={
                      task.dueDate ? (
                        <span className="inline-flex items-center gap-2">
                          {formatDate(task.dueDate)}
                          {overdueFlag && (
                            <span className="text-[10px] uppercase tracking-wide text-danger font-semibold">
                              Overdue
                            </span>
                          )}
                          {!overdueFlag && upcomingFlag && (
                            <span className="text-[10px] uppercase tracking-wide text-warning font-semibold">
                              Soon
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">No due date</span>
                      )
                    }
                  />
                  <DetailRow
                    icon={<UserCircle2 className="h-4 w-4" />}
                    label="Assignee"
                    value={
                      assignee ? (
                        <span className="inline-flex items-center gap-2">
                          <Avatar name={assignee.name} size="sm" />
                          <span className="truncate">{assignee.name}</span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Unassigned</span>
                      )
                    }
                    action={
                      canManageMembers ? (
                        <button
                          type="button"
                          onClick={() => onAssign(task)}
                          className="text-xs text-primary hover:underline"
                        >
                          {assignee ? "Reassign" : "Assign"}
                        </button>
                      ) : null
                    }
                  />
                  <DetailRow
                    icon={<Flag className="h-4 w-4" />}
                    label="Created by"
                    value={
                      creator ? (
                        <span className="inline-flex items-center gap-2">
                          <Avatar name={creator.name} size="sm" />
                          <span className="truncate">{creator.name}</span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Unknown</span>
                      )
                    }
                  />
                </dl>
              </section>

              {task.description && (
                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                    Description
                  </h3>
                  <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                    {task.description}
                  </p>
                </section>
              )}

              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground inline-flex items-center gap-2">
                    <MessageCircle className="h-3.5 w-3.5" />
                    Comments ({comments.length})
                  </h3>
                </div>

                {commentsLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-3/4" />
                  </div>
                ) : comments.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
                    No comments yet. Start the conversation.
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {comments.map((c) => (
                      <li
                        key={c.id}
                        className="flex items-start gap-2.5 rounded-lg border border-border bg-background p-3"
                      >
                        <Avatar name={c.authorName} size="sm" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline gap-2">
                            <span className="text-sm font-medium truncate">
                              {c.authorName}
                            </span>
                            <span
                              className="text-[10px] text-muted-foreground"
                              title={formatDate(c.createdAt, "PPpp")}
                            >
                              {timeAgo(c.createdAt)}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-foreground whitespace-pre-wrap break-words">
                            {c.body}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                <div ref={commentsEndRef} />
              </section>
            </div>

            <footer className="border-t border-border bg-background px-4 py-3">
              <div className="flex items-end gap-2">
                <textarea
                  ref={draftRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Write a comment… (⌘/Ctrl+Enter to send)"
                  rows={1}
                  className={cn(
                    "flex-1 resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm",
                    "placeholder:text-muted-foreground text-foreground",
                    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
                    "max-h-40",
                  )}
                />
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={postingComment || !draft.trim()}
                  className={cn(
                    "inline-flex h-9 w-9 items-center justify-center rounded-lg transition-all",
                    "bg-primary text-primary-foreground hover:bg-primary/90",
                    "disabled:opacity-50 disabled:pointer-events-none",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  )}
                  aria-label="Post comment"
                >
                  {postingComment ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                <span>Be respectful. Plain text only.</span>
                <button
                  type="button"
                  onClick={() => onEdit(task)}
                  className="hover:text-foreground"
                >
                  Edit task
                </button>
              </div>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
  action,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  action?: React.ReactNode;
  tone?: "default" | "warning" | "danger";
}) {
  const toneClass =
    tone === "danger"
      ? "text-danger"
      : tone === "warning"
        ? "text-warning"
        : "text-foreground";
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
        <div className={cn("mt-0.5 text-sm", toneClass)}>{value}</div>
      </div>
      {action && <div className="pt-1">{action}</div>}
    </div>
  );
}
