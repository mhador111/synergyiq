"use client";

import { useState, useTransition } from "react";
import { Calendar, Flag, GripVertical, MoreVertical, Pencil, Trash2, UserPlus } from "lucide-react";
import toast from "react-hot-toast";
import { mutate } from "swr";
import { TASK_STATUSES, type TaskStatus } from "@/lib/models/task";
import { updateTaskStatus, deleteTask } from "@/actions/tasks";
import type { ProjectTask, ProjectMember } from "@/hooks/useProjects";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Dropdown, DropdownItem, DropdownSeparator } from "@/components/ui/Dropdown";

const statusLabel: Record<TaskStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  completed: "Done",
};

const priorityVariant: Record<"high" | "medium" | "low", "danger" | "warning" | "neutral"> = {
  high: "danger",
  medium: "warning",
  low: "neutral",
};

const statusOrder: TaskStatus[] = TASK_STATUSES as unknown as TaskStatus[];

interface KanbanBoardProps {
  projectId: string;
  tasks: ProjectTask[];
  members: ProjectMember[];
  currentUserId: string;
  isOwnerOrManager: boolean;
  onEditTask: (task: ProjectTask) => void;
  onCreateTask: (status: TaskStatus) => void;
  onAssignTask: (task: ProjectTask) => void;
}

export function KanbanBoard({
  projectId,
  tasks,
  members,
  currentUserId,
  isOwnerOrManager,
  onEditTask,
  onCreateTask,
  onAssignTask,
}: KanbanBoardProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<TaskStatus | null>(null);
  const [, startTransition] = useTransition();

  const membersById = new Map(members.map((m) => [m.id, m]));

  function tasksForStatus(status: TaskStatus) {
    return tasks
      .filter((t) => t.status === status)
      .sort((a, b) => a.position - b.position);
  }

  function onDragStart(e: React.DragEvent, taskId: string) {
    setDraggingId(taskId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", taskId);
  }

  function onDragOver(e: React.DragEvent, status: TaskStatus) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (overColumn !== status) setOverColumn(status);
  }

  function onDragLeave() {
    setOverColumn(null);
  }

  function onDrop(e: React.DragEvent, status: TaskStatus) {
    e.preventDefault();
    setOverColumn(null);
    const taskId = e.dataTransfer.getData("text/plain") || draggingId;
    setDraggingId(null);
    if (!taskId) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === status) return;

    startTransition(async () => {
      // Optimistic update
      const prevKey = `/api/projects/${projectId}`;
      await mutate(
        prevKey,
        async (current: { project: unknown; tasks: ProjectTask[] } | undefined) => {
          if (!current) return current;
          return {
            ...current,
            tasks: current.tasks.map((t) =>
              t.id === taskId ? { ...t, status } : t,
            ),
          };
        },
        { revalidate: false, populateCache: true, rollbackOnError: true },
      );

      const res = await updateTaskStatus({ id: taskId, status });
      if (!res.ok) {
        toast.error(res.error);
        await mutate(prevKey);
      } else {
        toast.success(`Moved to ${statusLabel[status]}`);
      }
    });
  }

  async function handleDelete(task: ProjectTask) {
    if (!confirm(`Delete task "${task.title}"?`)) return;
    const res = await deleteTask(task.id);
    if (res.ok) {
      toast.success("Task deleted");
      await mutate(`/api/projects/${projectId}`);
      await mutate((key) => typeof key === "string" && key.startsWith("/api/tasks"));
    } else {
      toast.error(res.error);
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {statusOrder.map((status) => {
        const columnTasks = tasksForStatus(status);
        const isOver = overColumn === status;
        return (
          <div
            key={status}
            onDragOver={(e) => onDragOver(e, status)}
            onDragLeave={onDragLeave}
            onDrop={(e) => onDrop(e, status)}
            className={`rounded-xl border bg-card flex flex-col min-h-[300px] transition-colors ${
              isOver ? "border-primary bg-primary/5" : "border-border"
            }`}
          >
            <div className="flex items-center justify-between p-3 border-b border-border">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground">{statusLabel[status]}</h3>
                <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                  {columnTasks.length}
                </span>
              </div>
            </div>

            <div className="flex-1 p-2 space-y-2 overflow-y-auto">
              {columnTasks.length === 0 ? (
                <div className="flex items-center justify-center h-24 text-xs text-muted-foreground border border-dashed border-border rounded-lg">
                  Drop tasks here
                </div>
              ) : (
                columnTasks.map((task) => {
                  const assignee = task.assigneeId ? membersById.get(task.assigneeId) : null;
                  const isCreator = task.createdBy === currentUserId;
                  const canEdit = isCreator || isOwnerOrManager;
                  return (
                    <KanbanCard
                      key={task.id}
                      task={task}
                      assignee={assignee}
                      canEdit={canEdit}
                      isOwnerOrManager={isOwnerOrManager}
                      onEdit={() => onEditTask(task)}
                      onDelete={() => handleDelete(task)}
                      onAssign={() => onAssignTask(task)}
                      onDragStart={(e) => onDragStart(e, task.id)}
                      dragging={draggingId === task.id}
                    />
                  );
                })
              )}
            </div>

            <button
              type="button"
              onClick={() => onCreateTask(status)}
              className="m-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-md border border-dashed border-border transition-colors"
            >
              + Add task
            </button>
          </div>
        );
      })}
    </div>
  );
}

interface KanbanCardProps {
  task: ProjectTask;
  assignee: ProjectMember | null | undefined;
  canEdit: boolean;
  isOwnerOrManager: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onAssign: () => void;
  onDragStart: (e: React.DragEvent) => void;
  dragging: boolean;
}

function KanbanCard({
  task,
  assignee,
  canEdit,
  isOwnerOrManager,
  onEdit,
  onDelete,
  onAssign,
  onDragStart,
  dragging,
}: KanbanCardProps) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      className={`group bg-background border border-border rounded-lg p-3 cursor-grab active:cursor-grabbing transition-all hover:shadow-sm hover:border-primary/40 ${
        dragging ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="h-4 w-4 text-muted-foreground/50 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-medium text-foreground line-clamp-2">{task.title}</h4>
            {canEdit && (
              <Dropdown
                align="right"
                trigger={
                  <button className="p-0.5 rounded hover:bg-muted text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical className="h-3.5 w-3.5" />
                  </button>
                }
              >
                <DropdownItem onClick={onEdit}>
                  <Pencil className="h-4 w-4" /> Edit
                </DropdownItem>
                {isOwnerOrManager && (
                  <DropdownItem onClick={onAssign}>
                    <UserPlus className="h-4 w-4" /> {task.assigneeId ? "Reassign" : "Assign"}
                  </DropdownItem>
                )}
                <DropdownSeparator />
                <DropdownItem danger onClick={onDelete}>
                  <Trash2 className="h-4 w-4" /> Delete
                </DropdownItem>
              </Dropdown>
            )}
          </div>

          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{task.description}</p>
          )}

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge variant={priorityVariant[task.priority]}>
              <Flag className="h-3 w-3" /> {task.priority}
            </Badge>
            {task.dueDate && (
              <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(task.dueDate).toLocaleDateString()}
              </span>
            )}
          </div>

          {assignee && (
            <div className="flex items-center gap-2 mt-2">
              <Avatar name={assignee.name} size="sm" />
              <span className="text-xs text-muted-foreground">{assignee.name}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
