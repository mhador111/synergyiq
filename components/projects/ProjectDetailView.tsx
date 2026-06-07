"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Pencil, Plus, UserMinus, UserPlus, Users } from "lucide-react";
import toast from "react-hot-toast";

import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

import { KanbanBoard } from "@/components/projects/KanbanBoard";
import { TaskDetailDrawer } from "@/components/projects/TaskDetailDrawer";
import {
  useProject,
  useUsers,
  revalidateProjects,
  type ProjectDetail,
  type ProjectTask,
} from "@/hooks/useProjects";
import {
  updateProject,
  addProjectMember,
  removeProjectMember,
} from "@/actions/projects";
import { createTask, updateTask, assignTask } from "@/actions/tasks";
import {
  PROJECT_STATUSES,
  TASK_STATUSES,
  TASK_PRIORITIES,
  type ProjectStatus,
  type TaskStatus,
  type TaskPriority,
  type Role,
} from "@/lib/auth/roles";
import { hasRole } from "@/lib/auth/rbac";

const statusVariant: Record<ProjectStatus, "primary" | "success" | "warning"> = {
  active: "primary",
  completed: "success",
  on_hold: "warning",
};

const statusLabel: Record<ProjectStatus, string> = {
  active: "Active",
  completed: "Completed",
  on_hold: "On hold",
};

const taskStatusLabel: Record<TaskStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  completed: "Completed",
};

const taskPriorityLabel: Record<TaskPriority, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

interface ProjectDetailViewProps {
  projectId: string;
  initialProject: ProjectDetail;
  currentUserId: string;
  currentUserRole: Role;
}

export function ProjectDetailView({
  projectId,
  initialProject,
  currentUserId,
  currentUserRole,
}: ProjectDetailViewProps) {
  const router = useRouter();
  const { project, tasks, isLoading, revalidate } = useProject(projectId);
  const { users } = useUsers();

  // Fall back to server-provided data while SWR loads
  const projectData = project ?? initialProject;
  const taskData = tasks ?? [];

  const isOwner = projectData.ownerId === currentUserId;
  const canManage = isOwner || hasRole(currentUserRole, "manager");

  const [editing, setEditing] = useState(false);
  const [managingMembers, setManagingMembers] = useState(false);
  const [creatingTask, setCreatingTask] = useState<TaskStatus | null>(null);
  const [editingTask, setEditingTask] = useState<ProjectTask | null>(null);
  const [assigningTask, setAssigningTask] = useState<ProjectTask | null>(null);
  const [viewingTask, setViewingTask] = useState<ProjectTask | null>(null);

  const nonMemberUsers = useMemo(
    () =>
      users.filter(
        (u) =>
          !projectData.memberIds.includes(u.id) && u.id !== projectData.ownerId,
      ),
    [users, projectData.memberIds, projectData.ownerId],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={projectData.name}
        description={projectData.description || undefined}
        backHref="/projects"
        actions={
          <div className="flex items-center gap-2">
            <Badge variant={statusVariant[projectData.status]}>
              {statusLabel[projectData.status]}
            </Badge>
            {canManage && (
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Pencil className="h-4 w-4" />}
                onClick={() => setEditing(true)}
              >
                Edit
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          {isLoading && !project ? (
            <div className="space-y-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : taskData.length === 0 ? (
            <EmptyState
              icon={<Plus className="h-8 w-8" />}
              title="No tasks yet"
              description="Create your first task to get started."
              action={
                <Button
                  leftIcon={<Plus className="h-4 w-4" />}
                  onClick={() => setCreatingTask("todo")}
                >
                  New task
                </Button>
              }
            />
          ) : (
            <KanbanBoard
              projectId={projectId}
              tasks={taskData}
              members={projectData.members}
              currentUserId={currentUserId}
              isOwnerOrManager={canManage}
              onViewTask={(t) => setViewingTask(t)}
              onEditTask={(t) => setEditingTask(t)}
              onCreateTask={(s) => setCreatingTask(s)}
              onAssignTask={(t) => setAssigningTask(t)}
            />
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {projectData.deadline && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Due {new Date(projectData.deadline).toLocaleDateString()}
                  </span>
                </div>
              )}
              <div>
                <div className="text-xs text-muted-foreground mb-1">Owner</div>
                {projectData.owner ? (
                  <div className="flex items-center gap-2">
                    <Avatar name={projectData.owner.name} size="sm" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium">
                        {projectData.owner.name}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {projectData.owner.email}
                      </div>
                    </div>
                  </div>
                ) : (
                  <span className="text-muted-foreground text-xs">Unknown</span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4" /> Team ({projectData.members.length})
                </CardTitle>
                {canManage && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setManagingMembers(true)}
                    aria-label="Manage members"
                  >
                    <UserPlus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {projectData.members.length === 0 ? (
                <p className="text-xs text-muted-foreground">No members yet</p>
              ) : (
                projectData.members.map((m) => (
                  <div key={m.id} className="flex items-center gap-2">
                    <Avatar name={m.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">
                        {m.name}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {m.email}
                      </div>
                    </div>
                    <Badge variant="neutral" className="text-[10px]">
                      {m.role}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <EditProjectModal
        open={editing}
        onClose={() => setEditing(false)}
        project={projectData}
        onSaved={async () => {
          await revalidate();
          await revalidateProjects();
          router.refresh();
        }}
      />

      <ManageMembersModal
        open={managingMembers}
        onClose={() => setManagingMembers(false)}
        project={projectData}
        availableUsers={nonMemberUsers}
        onChanged={async () => {
          await revalidate();
          await revalidateProjects();
        }}
      />

      {creatingTask && (
        <TaskFormModal
          mode="create"
          defaultStatus={creatingTask}
          projectId={projectId}
          members={projectData.members}
          onClose={() => setCreatingTask(null)}
          onSaved={async () => {
            await revalidate();
            setCreatingTask(null);
          }}
        />
      )}

      {editingTask && (
        <TaskFormModal
          mode="edit"
          task={editingTask}
          projectId={projectId}
          members={projectData.members}
          onClose={() => setEditingTask(null)}
          onSaved={async () => {
            await revalidate();
            setEditingTask(null);
          }}
        />
      )}

      {assigningTask && (
        <AssignTaskModal
          task={assigningTask}
          members={projectData.members}
          onClose={() => setAssigningTask(null)}
          onSaved={async () => {
            await revalidate();
            setAssigningTask(null);
          }}
        />
      )}

      <TaskDetailDrawer
        task={viewingTask}
        members={projectData.members}
        onClose={() => setViewingTask(null)}
        onEdit={(t) => {
          setViewingTask(null);
          setEditingTask(t);
        }}
        onAssign={(t) => {
          setViewingTask(null);
          setAssigningTask(t);
        }}
        canManageMembers={canManage}
      />
    </div>
  );
}

function EditProjectModal({
  open,
  onClose,
  project,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  project: ProjectDetail;
  onSaved: () => Promise<void>;
}) {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? "");
  const [status, setStatus] = useState<ProjectStatus>(project.status);
  const [deadline, setDeadline] = useState<string>(
    project.deadline ? project.deadline.slice(0, 10) : "",
  );
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    const deadlineDate: Date | null = deadline
      ? new Date(deadline)
      : project.deadline
        ? new Date(project.deadline)
        : null;
    const res = await updateProject({
      id: project.id,
      name: name.trim(),
      description: description.trim(),
      status,
      deadline: deadlineDate ?? undefined,
    });
    setSaving(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Project updated");
    await onSaved();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit project" size="md">
      <div className="space-y-4">
        <Input
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Textarea
          label="Description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Status"
            options={PROJECT_STATUSES.map((s) => ({
              value: s,
              label: statusLabel[s],
            }))}
            value={status}
            onChange={(e) => setStatus(e.target.value as ProjectStatus)}
          />
          <Input
            type="date"
            label="Deadline"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} isLoading={saving}>
            Save changes
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function ManageMembersModal({
  open,
  onClose,
  project,
  availableUsers,
  onChanged,
}: {
  open: boolean;
  onClose: () => void;
  project: ProjectDetail;
  availableUsers: { id: string; name: string; email: string; role: string; avatarColor: string }[];
  onChanged: () => Promise<void>;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleAdd(userId: string) {
    setBusyId(userId);
    const res = await addProjectMember({ projectId: project.id, userId });
    setBusyId(null);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Member added");
    await onChanged();
  }

  async function handleRemove(userId: string, name: string) {
    if (!confirm("Remove " + name + " from this project?")) return;
    setBusyId(userId);
    const res = await removeProjectMember({ projectId: project.id, userId });
    setBusyId(null);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Member removed");
    await onChanged();
  }

  return (
    <Modal open={open} onClose={onClose} title="Manage members" size="lg">
      <div className="space-y-5">
        <div>
          <h4 className="text-sm font-semibold mb-2">
            Current members ({project.members.length})
          </h4>
          {project.members.length === 0 ? (
            <p className="text-xs text-muted-foreground">No members yet</p>
          ) : (
            <ul className="divide-y divide-border -mx-1">
              {project.members.map((m) => {
                const isOwner = m.id === project.ownerId;
                return (
                  <li key={m.id} className="flex items-center gap-3 px-1 py-2">
                    <Avatar name={m.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">
                        {m.name}{" "}
                        {isOwner && (
                          <span className="text-xs text-primary">(owner)</span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {m.email}
                      </div>
                    </div>
                    {!isOwner && (
                      <Button
                        variant="ghost"
                        size="icon"
                        isLoading={busyId === m.id}
                        onClick={() => handleRemove(m.id, m.name)}
                        aria-label={"Remove " + m.name}
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {availableUsers.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2">Add members</h4>
            <ul className="divide-y divide-border -mx-1 max-h-60 overflow-y-auto">
              {availableUsers.map((u) => (
                <li key={u.id} className="flex items-center gap-3 px-1 py-2">
                  <Avatar name={u.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{u.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {u.email}
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    isLoading={busyId === u.id}
                    onClick={() => handleAdd(u.id)}
                  >
                    Add
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button onClick={onClose}>Done</Button>
        </div>
      </div>
    </Modal>
  );
}

function TaskFormModal({
  mode,
  task,
  defaultStatus,
  projectId,
  members,
  onClose,
  onSaved,
}: {
  mode: "create" | "edit";
  task?: ProjectTask;
  defaultStatus?: TaskStatus;
  projectId: string;
  members: { id: string; name: string; email: string; role: string; avatarColor: string }[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [status, setStatus] = useState<TaskStatus>(
    task?.status ?? defaultStatus ?? "todo",
  );
  const [priority, setPriority] = useState<TaskPriority>(
    (task?.priority as TaskPriority) ?? "medium",
  );
  const [dueDate, setDueDate] = useState(
    task?.dueDate ? task.dueDate.slice(0, 10) : "",
  );
  const [assigneeId, setAssigneeId] = useState<string>(task?.assigneeId ?? "");
  const [saving, setSaving] = useState(false);

  const assigneeOptions = [
    { value: "", label: "Unassigned" },
    ...members.map((m) => ({ value: m.id, label: m.name })),
  ];

  async function handleSave() {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!dueDate) {
      toast.error("Due date is required");
      return;
    }
    setSaving(true);

    try {
      const res =
        mode === "create"
          ? await createTask({
              projectId,
              title: title.trim(),
              description: description.trim(),
              status,
              priority,
              dueDate: new Date(dueDate),
              assigneeId: assigneeId || null,
            })
          : await updateTask({
              id: task!.id,
              title: title.trim(),
              description: description.trim(),
              status,
              priority,
              dueDate: new Date(dueDate),
              assigneeId: assigneeId || undefined,
            });

      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(mode === "create" ? "Task created" : "Task updated");
      await onSaved();
    } catch {
      toast.error("Could not save task");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={mode === "create" ? "New task" : "Edit task"}
      size="md"
    >
      <div className="space-y-4">
        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to be done?"
        />
        <Textarea
          label="Description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add more detail (optional)"
        />
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Status"
            options={TASK_STATUSES.map((s) => ({
              value: s,
              label: taskStatusLabel[s],
            }))}
            value={status}
            onChange={(e) => setStatus(e.target.value as TaskStatus)}
          />
          <Select
            label="Priority"
            options={TASK_PRIORITIES.map((p) => ({
              value: p,
              label: taskPriorityLabel[p],
            }))}
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input
            type="date"
            label="Due date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
          <Select
            label="Assignee"
            options={assigneeOptions}
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} isLoading={saving}>
            {mode === "create" ? "Create task" : "Save changes"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function AssignTaskModal({
  task,
  members,
  onClose,
  onSaved,
}: {
  task: ProjectTask;
  members: { id: string; name: string; email: string; role: string; avatarColor: string }[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleAssign(assigneeId: string | null) {
    setBusyId(assigneeId ?? "unassign");
    const res = await assignTask({ id: task.id, assigneeId });
    setBusyId(null);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(assigneeId ? "Task assigned" : "Task unassigned");
    await onSaved();
  }

  return (
    <Modal open onClose={onClose} title={"Assign \"" + task.title + "\""} size="md">
      <div className="space-y-3">
        {task.assigneeId && (
          <button
            type="button"
            onClick={() => handleAssign(null)}
            disabled={busyId !== null}
            className="w-full flex items-center gap-3 rounded-lg border border-dashed border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            <Avatar name="?" size="sm" />
            <span className="flex-1 text-left">Unassign</span>
            {busyId === "unassign" && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            )}
          </button>
        )}

        <ul className="divide-y divide-border -mx-1 max-h-80 overflow-y-auto">
          {members.map((m) => {
            const isCurrent = m.id === task.assigneeId;
            return (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => handleAssign(m.id)}
                  disabled={busyId !== null}
                  className="w-full flex items-center gap-3 px-1 py-2 hover:bg-muted transition-colors disabled:opacity-50"
                >
                  <Avatar name={m.name} size="sm" />
                  <div className="min-w-0 flex-1 text-left">
                    <div className="text-sm font-medium truncate">{m.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {m.email}
                    </div>
                  </div>
                  {isCurrent && (
                    <Badge variant="primary" className="text-[10px]">
                      Current
                    </Badge>
                  )}
                  {busyId === m.id && (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        <div className="flex justify-end pt-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}
