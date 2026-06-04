import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongoose";
import { Project } from "@/lib/models/project";
import { Task } from "@/lib/models/task";
import { User } from "@/lib/models/user";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid project id" }, { status: 400 });
  }

  await connectDB();
  const me = new mongoose.Types.ObjectId(session.user.id);

  const project = await Project.findById(id).lean();
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const isMember =
    project.ownerId.toString() === me.toString() ||
    project.memberIds.some((m) => m.toString() === me.toString());
  if (!isMember) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Fetch tasks grouped by status
  const tasks = await Task.find({ projectId: project._id })
    .sort({ status: 1, position: 1, createdAt: 1 })
    .lean();

  // Fetch members (populate names + avatarColor)
  const memberIds = [
    project.ownerId,
    ...project.memberIds.filter((m) => m.toString() !== project.ownerId.toString()),
  ];
  const members = await User.find(
    { _id: { $in: memberIds } },
    { name: 1, email: 1, role: 1, avatarColor: 1 },
  ).lean();

  const memberMap = new Map(members.map((m) => [m._id.toString(), m]));
  const owner = memberMap.get(project.ownerId.toString());

  return NextResponse.json({
    project: {
      id: project._id.toString(),
      name: project.name,
      description: project.description,
      status: project.status,
      deadline: project.deadline ?? null,
      ownerId: project.ownerId.toString(),
      memberIds: project.memberIds.map((m) => m.toString()),
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      owner: owner
        ? {
            id: owner._id.toString(),
            name: owner.name,
            email: owner.email,
            role: owner.role,
            avatarColor: owner.avatarColor,
          }
        : null,
      members: project.memberIds
        .map((m) => memberMap.get(m.toString()))
        .filter((m): m is NonNullable<typeof m> => Boolean(m))
        .map((m) => ({
          id: m._id.toString(),
          name: m.name,
          email: m.email,
          role: m.role,
          avatarColor: m.avatarColor,
        })),
    },
    tasks: tasks.map((t) => ({
      id: t._id.toString(),
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate ?? null,
      projectId: t.projectId.toString(),
      assigneeId: t.assigneeId ? t.assigneeId.toString() : null,
      createdBy: t.createdBy.toString(),
      position: t.position,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    })),
  });
}
