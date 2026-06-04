import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongoose";
import { Project } from "@/lib/models/project";
import { Task } from "@/lib/models/task";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const me = new mongoose.Types.ObjectId(session.user.id);

  // Projects the user owns or is a member of.
  const projects = await Project.find({
    $or: [{ ownerId: me }, { memberIds: me }],
  })
    .sort({ updatedAt: -1 })
    .lean();

  if (!projects.length) return NextResponse.json({ projects: [] });

  // Per-project task counts in one round-trip.
  const ids = projects.map((p) => p._id);
  const counts = await Task.aggregate<{
    _id: mongoose.Types.ObjectId;
    total: number;
    done: number;
  }>([
    { $match: { projectId: { $in: ids } } },
    {
      $group: {
        _id: "$projectId",
        total: { $sum: 1 },
        done: {
          $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
        },
      },
    },
  ]);
  const byProject = new Map(
    counts.map((c) => [c._id.toString(), { total: c.total, done: c.done }]),
  );

  const result = projects.map((p) => {
    const c = byProject.get(p._id.toString()) ?? { total: 0, done: 0 };
    return {
      id: p._id.toString(),
      name: p.name,
      description: p.description,
      status: p.status,
      deadline: p.deadline ?? null,
      ownerId: p.ownerId.toString(),
      memberIds: p.memberIds.map((m) => m.toString()),
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      taskCount: c.total,
      completedCount: c.done,
      progress: c.total > 0 ? Math.round((c.done / c.total) * 100) : 0,
    };
  });

  return NextResponse.json({ projects: result });
}
