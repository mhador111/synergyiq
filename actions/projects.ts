"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db/mongoose";
import { Project, PROJECT_STATUSES } from "@/lib/models/project";
import { Task } from "@/lib/models/task";
import { User, type Role } from "@/lib/models/user";
import { logActivity } from "@/lib/utils/activity";
import { auth } from "@/lib/auth/auth";
import { hasRole } from "@/lib/auth/rbac";
import { fail, ok, type Result } from "@/lib/utils/result";import { notifyUser } from "@/actions/notifications";import {
  addMemberSchema,
  projectCreateSchema,
  projectIdSchema,
  projectUpdateSchema,
  removeMemberSchema,
  type ProjectCreateInput,
  type ProjectUpdateInput,
} from "@/lib/validations/project";

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return { id: session.user.id, role: (session.user.role ?? "member") as Role };
}

function isOwnerOrMember(project: { ownerId: unknown; memberIds: unknown[] }, userId: string) {
  const isOwner = String(project.ownerId) === userId;
  const isMember = (project.memberIds ?? []).some((m) => String(m) === userId);
  return isOwner || isMember;
}

export async function createProject(input: ProjectCreateInput): Promise<Result<{ id: string }>> {
  const me = await requireUser();
  if (!me) return fail("You must be signed in.");

  const parsed = projectCreateSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input");

  const data = parsed.data;
  if (!PROJECT_STATUSES.includes(data.status)) return fail("Invalid status");

  await connectDB();

  // Verify all memberIds are real users
  if (data.memberIds.length > 0) {
    const found = await User.find({ _id: { $in: data.memberIds } })
      .select("_id")
      .lean();
    if (found.length !== data.memberIds.length) return fail("One or more members are invalid");
  }

  // Owner is always part of members
  const memberSet = new Set<string>(data.memberIds);
  memberSet.add(me.id);

  const project = await Project.create({
    name: data.name,
    description: data.description ?? "",
    deadline: data.deadline,
    status: data.status,
    ownerId: me.id,
    memberIds: Array.from(memberSet),
  });

  await logActivity({
    type: "project_created",
    message: `Created project "${project.name}"`,
    actorId: me.id,
    projectId: project._id.toString(),
  });

  revalidatePath("/projects");
  revalidatePath("/dashboard");
  return ok({ id: project._id.toString() });
}

export async function updateProject(
  input: ProjectUpdateInput,
): Promise<Result<{ id: string }>> {
  const me = await requireUser();
  if (!me) return fail("You must be signed in.");

  const parsed = projectUpdateSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input");

  const data = parsed.data;
  if (data.status && !PROJECT_STATUSES.includes(data.status)) {
    return fail("Invalid status");
  }

  await connectDB();
  const project = await Project.findById(data.id);
  if (!project) return fail("Project not found");

  const isOwner = String(project.ownerId) === me.id;
  if (!isOwner && !hasRole(me.role, "manager")) {
    return fail("Only the owner or a manager can edit this project");
  }

  // Verify new members are real users (if changing them)
  if (data.memberIds) {
    if (data.memberIds.length > 0) {
      const found = await User.find({ _id: { $in: data.memberIds } })
        .select("_id")
        .lean();
      if (found.length !== data.memberIds.length) return fail("One or more members are invalid");
    }
    const memberSet = new Set<string>(data.memberIds);
    memberSet.add(me.id);
    project.memberIds = Array.from(memberSet) as never;
  }

  const oldStatus = project.status;
  if (data.name !== undefined) project.name = data.name;
  if (data.description !== undefined) project.description = data.description;
  if (data.deadline !== undefined) project.deadline = data.deadline;
  if (data.status !== undefined) project.status = data.status;

  await project.save();

  if (data.status && data.status !== oldStatus) {
    await logActivity({
      type: "project_updated",
      message: `Changed project status to "${data.status}"`,
      actorId: me.id,
      projectId: project._id.toString(),
    });
  } else {
    await logActivity({
      type: "project_updated",
      message: `Updated project "${project.name}"`,
      actorId: me.id,
      projectId: project._id.toString(),
    });
  }

  revalidatePath("/projects");
  revalidatePath(`/projects/${project._id.toString()}`);
  revalidatePath("/dashboard");
  return ok({ id: project._id.toString() });
}

export async function deleteProject(id: string): Promise<Result<{ id: string }>> {
  const me = await requireUser();
  if (!me) return fail("You must be signed in.");

  const parsed = projectIdSchema.safeParse({ id });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid id");

  await connectDB();
  const project = await Project.findById(parsed.data.id);
  if (!project) return fail("Project not found");

  const isOwner = String(project.ownerId) === me.id;
  if (!isOwner && !hasRole(me.role, "manager")) {
    return fail("Only the owner or a manager can delete this project");
  }

  const projectId = project._id.toString();
  const name = project.name;

  // Cascade delete tasks
  await Task.deleteMany({ projectId: project._id });

  await Project.deleteOne({ _id: project._id });

  await logActivity({
    type: "project_deleted",
    message: `Deleted project "${name}"`,
    actorId: me.id,
    projectId,
  });

  revalidatePath("/projects");
  revalidatePath("/dashboard");
  return ok({ id: projectId });
}

export async function addProjectMember(
  input: { projectId: string; userId: string },
): Promise<Result<{ projectId: string; userId: string }>> {
  const me = await requireUser();
  if (!me) return fail("You must be signed in.");

  const parsed = addMemberSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input");

  await connectDB();

  const project = await Project.findById(parsed.data.projectId);
  if (!project) return fail("Project not found");

  const isOwner = String(project.ownerId) === me.id;
  if (!isOwner && !hasRole(me.role, "manager")) {
    return fail("Only the owner or a manager can add members");
  }

  const user = await User.findById(parsed.data.userId).select("name").lean();
  if (!user) return fail("User not found");

  const alreadyMember = (project.memberIds ?? []).some(
    (m) => String(m) === parsed.data.userId,
  );
  if (alreadyMember) return ok({ projectId: project._id.toString(), userId: parsed.data.userId });

  project.memberIds = [...(project.memberIds ?? []), parsed.data.userId] as never;
  await project.save();

  await logActivity({
    type: "member_added",
    message: `Added ${user.name} to project "${project.name}"`,
    actorId: me.id,
    projectId: project._id.toString(),
  });

  // Notify the new member (skip if they added themselves)
  if (parsed.data.userId !== me.id) {
    await notifyUser({
      userId: parsed.data.userId,
      title: "Added to a project",
      body: `You're now a member of "${project.name}"`,
      link: `/projects/${project._id.toString()}`,
    });
  }

  revalidatePath(`/projects/${project._id.toString()}`);
  return ok({ projectId: project._id.toString(), userId: parsed.data.userId });
}

export async function removeProjectMember(
  input: { projectId: string; userId: string },
): Promise<Result<{ projectId: string; userId: string }>> {
  const me = await requireUser();
  if (!me) return fail("You must be signed in.");

  const parsed = removeMemberSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input");

  await connectDB();

  const project = await Project.findById(parsed.data.projectId);
  if (!project) return fail("Project not found");

  const isOwner = String(project.ownerId) === me.id;
  if (!isOwner && !hasRole(me.role, "manager")) {
    return fail("Only the owner or a manager can remove members");
  }

  // Cannot remove the owner
  if (String(project.ownerId) === parsed.data.userId) {
    return fail("Cannot remove the project owner");
  }

  const user = await User.findById(parsed.data.userId).select("name").lean();
  if (!user) return fail("User not found");

  project.memberIds = (project.memberIds ?? []).filter(
    (m) => String(m) !== parsed.data.userId,
  ) as never;
  await project.save();

  await logActivity({
    type: "member_removed",
    message: `Removed ${user.name} from project "${project.name}"`,
    actorId: me.id,
    projectId: project._id.toString(),
  });

  revalidatePath(`/projects/${project._id.toString()}`);
  return ok({ projectId: project._id.toString(), userId: parsed.data.userId });
}

// Helper used by API routes and pages to gate access
export async function getProjectForUser(projectId: string) {
  const me = await requireUser();
  if (!me) return { error: "You must be signed in." as const };
  await connectDB();
  const project = await Project.findById(projectId).lean();
  if (!project) return { error: "Project not found" as const };
  if (!isOwnerOrMember(project, me.id)) return { error: "Forbidden" as const };
  return { project, me };
}
