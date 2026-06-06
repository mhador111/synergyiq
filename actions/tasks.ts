"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db/mongoose";
import { Project, type ProjectDoc } from "@/lib/models/project";
import { Task, TASK_STATUSES } from "@/lib/models/task";
import { User, type Role } from "@/lib/models/user";
import { Comment } from "@/lib/models/comment";
import { logActivity } from "@/lib/utils/activity";
import { auth } from "@/lib/auth/auth";
import { hasRole } from "@/lib/auth/rbac";
import { ok, fail, type Result } from "@/lib/utils/result";
import {
  taskAssignSchema,
  taskCreateSchema,
  taskIdSchema,
  taskStatusSchema,
  taskUpdateSchema,
  type TaskAssignInput,
  type TaskCreateInput,
  type TaskStatusInput,
  type TaskUpdateInput,
} from "@/lib/validations/task";
import {
  commentCreateSchema,
  type CommentCreateInput,
} from "@/lib/validations/comment";
import { notifyMany, notifyUser } from "@/actions/notifications";

type AccessResult =
  | { ok: true; project: ProjectDoc; isOwner: boolean }
  | { ok: false; error: string };

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return {
    id: session.user.id,
    role: (session.user.role ?? "member") as Role,
  };
}

async function loadProjectForMember(
  projectId: string,
  userId: string,
  role: Role,
): Promise<AccessResult> {
  const project = (await Project.findById(projectId).lean()) as ProjectDoc | null;
  if (!project) return { ok: false, error: "Project not found" };
  const isOwner = String(project.ownerId) === userId;
  const isMember = (project.memberIds ?? []).some((m: unknown) => String(m) === userId);
  if (!isOwner && !isMember && !hasRole(role, "manager")) {
    return { ok: false, error: "Forbidden" };
  }
  return { ok: true, project, isOwner };
}

async function isProjectMember(
  project: ProjectDoc,
  userId: string,
): Promise<boolean> {
  if (String(project.ownerId) === userId) return true;
  return (project.memberIds ?? []).some((m: unknown) => String(m) === userId);
}

async function nextPosition(projectId: string, status: string) {
  const last = await Task.findOne({ projectId, status })
    .sort({ position: -1 })
    .select("position")
    .lean();
  return ((last as { position?: number } | null)?.position ?? -1) + 1;
}

export async function createTask(
  input: TaskCreateInput,
): Promise<Result<{ id: string }>> {
  const me = await requireUser();
  if (!me) return fail("You must be signed in.");

  const parsed = taskCreateSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid input");
  }
  const data = parsed.data;
  if (!TASK_STATUSES.includes(data.status)) return fail("Invalid status");

  await connectDB();

  const access = await loadProjectForMember(data.projectId, me.id, me.role);
  if (!access.ok) return fail(access.error);

  if (data.assigneeId) {
    const okMember = await isProjectMember(access.project, data.assigneeId);
    if (!okMember) return fail("Assignee is not a member of this project");
  }

  const position = await nextPosition(data.projectId, data.status);

  const task = await Task.create({
    title: data.title,
    description: data.description ?? "",
    projectId: data.projectId,
    assigneeId: data.assigneeId ?? null,
    dueDate: data.dueDate,
    priority: data.priority,
    status: data.status,
    position,
    createdBy: me.id,
  });

  await logActivity({
    type: "task_created",
    message: `Created task "${task.title}"`,
    actorId: me.id,
    projectId: data.projectId,
    taskId: task._id.toString(),
  });

  revalidatePath(`/projects/${data.projectId}`);
  revalidatePath("/tasks");
  return ok({ id: task._id.toString() });
}

export async function updateTask(
  input: TaskUpdateInput,
): Promise<Result<{ id: string }>> {
  const me = await requireUser();
  if (!me) return fail("You must be signed in.");

  const parsed = taskUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid input");
  }
  const data = parsed.data;
  if (data.status && !TASK_STATUSES.includes(data.status)) return fail("Invalid status");

  await connectDB();
  const task = await Task.findById(data.id);
  if (!task) return fail("Task not found");

  const access = await loadProjectForMember(task.projectId.toString(), me.id, me.role);
  if (!access.ok) return fail(access.error);

  const isCreator = String(task.createdBy) === me.id;
  if (!isCreator && !access.isOwner && !hasRole(me.role, "manager")) {
    return fail("Only the task creator, project owner, or a manager can edit this task");
  }

  if (data.assigneeId !== undefined) {
    if (data.assigneeId) {
      const okMember = await isProjectMember(access.project, data.assigneeId);
      if (!okMember) return fail("Assignee is not a member of this project");
    }
    task.assigneeId = (data.assigneeId ?? null) as unknown as never;
  }

  if (data.title !== undefined) task.title = data.title;
  if (data.description !== undefined) task.description = data.description;
  if (data.dueDate !== undefined) task.dueDate = data.dueDate;
  if (data.priority !== undefined) task.priority = data.priority;
  if (data.status !== undefined) task.status = data.status;

  await task.save();

  await logActivity({
    type: "task_updated",
    message: `Updated task "${task.title}"`,
    actorId: me.id,
    projectId: task.projectId.toString(),
    taskId: task._id.toString(),
  });

  revalidatePath(`/projects/${task.projectId.toString()}`);
  revalidatePath("/tasks");
  return ok({ id: task._id.toString() });
}

export async function updateTaskStatus(
  input: TaskStatusInput,
): Promise<Result<{ id: string }>> {
  const me = await requireUser();
  if (!me) return fail("You must be signed in.");

  const parsed = taskStatusSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  await connectDB();
  const task = await Task.findById(parsed.data.id);
  if (!task) return fail("Task not found");

  const access = await loadProjectForMember(task.projectId.toString(), me.id, me.role);
  if (!access.ok) return fail(access.error);

  const oldStatus = task.status;
  if (oldStatus === parsed.data.status) return ok({ id: task._id.toString() });

  task.status = parsed.data.status;
  task.position = await nextPosition(
    task.projectId.toString(),
    parsed.data.status,
  );
  await task.save();

  await logActivity({
    type: "task_status_changed",
    message: `Moved task "${task.title}" from "${oldStatus}" to "${parsed.data.status}"`,
    actorId: me.id,
    projectId: task.projectId.toString(),
    taskId: task._id.toString(),
  });

  revalidatePath(`/projects/${task.projectId.toString()}`);
  revalidatePath("/tasks");
  return ok({ id: task._id.toString() });
}

export async function assignTask(
  input: TaskAssignInput,
): Promise<Result<{ id: string }>> {
  const me = await requireUser();
  if (!me) return fail("You must be signed in.");

  const parsed = taskAssignSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  await connectDB();
  const task = await Task.findById(parsed.data.id);
  if (!task) return fail("Task not found");

  const access = await loadProjectForMember(task.projectId.toString(), me.id, me.role);
  if (!access.ok) return fail(access.error);

  if (parsed.data.assigneeId) {
    const okMember = await isProjectMember(access.project, parsed.data.assigneeId);
    if (!okMember) return fail("Assignee is not a member of this project");
    const user = await User.findById(parsed.data.assigneeId).select("name").lean();
    if (!user) return fail("Assignee not found");
  }

  task.assigneeId = (parsed.data.assigneeId ?? null) as unknown as never;
  await task.save();

  await logActivity({
    type: "task_assigned",
    message: parsed.data.assigneeId
      ? `Assigned task "${task.title}"`
      : `Unassigned task "${task.title}"`,
    actorId: me.id,
    projectId: task.projectId.toString(),
    taskId: task._id.toString(),
  });

  // Notify the new assignee (skip if the actor assigned it to themselves)
  if (
    parsed.data.assigneeId &&
    String(parsed.data.assigneeId) !== String(me.id)
  ) {
    await notifyUser({
      userId: parsed.data.assigneeId,
      title: "Task assigned to you",
      body: `"${task.title}"`,
      link: `/projects/${task.projectId.toString()}?taskId=${task._id.toString()}`,
    });
  }

  revalidatePath(`/projects/${task.projectId.toString()}`);
  revalidatePath("/tasks");
  return ok({ id: task._id.toString() });
}

export async function deleteTask(
  id: string,
): Promise<Result<{ id: string }>> {
  const me = await requireUser();
  if (!me) return fail("You must be signed in.");

  const parsed = taskIdSchema.safeParse({ id });
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid id");
  }

  await connectDB();
  const task = await Task.findById(parsed.data.id);
  if (!task) return fail("Task not found");

  const access = await loadProjectForMember(task.projectId.toString(), me.id, me.role);
  if (!access.ok) return fail(access.error);

  const isCreator = String(task.createdBy) === me.id;
  if (!isCreator && !access.isOwner && !hasRole(me.role, "manager")) {
    return fail("Only the task creator, project owner, or a manager can delete this task");
  }

  const projectId = task.projectId.toString();
  const title = task.title;
  await Task.deleteOne({ _id: task._id });

  await logActivity({
    type: "task_deleted",
    message: `Deleted task "${title}"`,
    actorId: me.id,
    projectId,
    taskId: parsed.data.id,
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/tasks");
  return ok({ id: parsed.data.id });
}

export async function addComment(
  input: CommentCreateInput,
): Promise<Result<{ id: string }>> {
  const me = await requireUser();
  if (!me) return fail("You must be signed in.");

  const parsed = commentCreateSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid input");
  }
  const { taskId, body } = parsed.data;

  await connectDB();

  const task = await Task.findById(taskId)
    .select("projectId title assigneeId createdBy")
    .lean();
  if (!task) return fail("Task not found");

  const access = await loadProjectForMember(
    task.projectId.toString(),
    me.id,
    me.role,
  );
  if (!access.ok) return fail(access.error);

  const comment = await Comment.create({
    taskId,
    authorId: me.id,
    body,
  });

  await logActivity({
    type: "comment_added",
    message: `Commented on "${task.title}"`,
    actorId: me.id,
    projectId: task.projectId.toString(),
    taskId,
  });

  // Notify task assignee + creator (skip the actor)
  const targets: Array<string | null | undefined> = [
    task.assigneeId ? String(task.assigneeId) : null,
    task.createdBy ? String(task.createdBy) : null,
  ];
  await notifyMany({
    userIds: targets,
    title: "New comment on task",
    body: `"${task.title}"`,
    link: `/projects/${task.projectId.toString()}?taskId=${taskId}`,
  });

  revalidatePath(`/projects/${task.projectId.toString()}`);
  return ok({ id: comment._id.toString() });
}
