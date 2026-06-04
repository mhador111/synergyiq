import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongoose";
import { Project } from "@/lib/models/project";
import { Task } from "@/lib/models/task";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const me = new mongoose.Types.ObjectId(session.user.id);

  // Find projects the user is a member of
  const myProjects = await Project.find(
    { $or: [{ ownerId: me }, { memberIds: me }] },
    { _id: 1 },
  ).lean();
  const projectIds = myProjects.map((p) => p._id);

  if (!projectIds.length) return NextResponse.json({ tasks: [] });

  const { searchParams } = new URL(req.url);
  const mine = searchParams.get("mine") === "1";
  const status = searchParams.get("status");
  const projectId = searchParams.get("projectId");

  const filter: Record<string, unknown> = { projectId: { $in: projectIds } };
  if (mine) filter.assigneeId = me;
  if (status) filter.status = status;
  if (projectId && mongoose.isValidObjectId(projectId)) {
    filter.projectId = new mongoose.Types.ObjectId(projectId);
  }

  const tasks = await Task.find(filter)
    .sort({ status: 1, position: 1, createdAt: -1 })
    .lean();

  return NextResponse.json({
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
