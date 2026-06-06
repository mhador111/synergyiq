import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongoose";
import { Project } from "@/lib/models/project";
import { Task } from "@/lib/models/task";
import { Activity } from "@/lib/models/activity";

export const dynamic = "force-dynamic";

const DAYS = 14;

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

function formatDay(d: Date) {
  return d.toISOString().slice(0, 10);
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const me = new mongoose.Types.ObjectId(session.user.id);

  // Scope to projects the caller can see
  const accessibleProjects = await Project.find({
    $or: [{ ownerId: me }, { memberIds: me }],
  })
    .select("_id name status")
    .lean();
  const projectIds = accessibleProjects.map((p) => p._id);

  if (projectIds.length === 0) {
    return NextResponse.json({
      tasksByStatus: { todo: 0, in_progress: 0, completed: 0 },
      tasksByPriority: { high: 0, medium: 0, low: 0 },
      projectProgress: [],
      activityByDay: [],
    });
  }

  // Tasks by status (across user's projects)
  const statusAgg = await Task.aggregate<{ _id: string; count: number }>([
    { $match: { projectId: { $in: projectIds } } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  const tasksByStatus = { todo: 0, in_progress: 0, completed: 0 };
  for (const row of statusAgg) {
    if (row._id in tasksByStatus) {
      (tasksByStatus as Record<string, number>)[row._id] = row.count;
    }
  }

  // Tasks by priority
  const priorityAgg = await Task.aggregate<{ _id: string; count: number }>([
    { $match: { projectId: { $in: projectIds } } },
    { $group: { _id: "$priority", count: { $sum: 1 } } },
  ]);
  const tasksByPriority = { high: 0, medium: 0, low: 0 };
  for (const row of priorityAgg) {
    if (row._id in tasksByPriority) {
      (tasksByPriority as Record<string, number>)[row._id] = row.count;
    }
  }

  // Project progress: per-project total/done
  const projectTaskCounts = await Task.aggregate<{
    _id: mongoose.Types.ObjectId;
    total: number;
    done: number;
  }>([
    { $match: { projectId: { $in: projectIds } } },
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
  const countByProject = new Map(
    projectTaskCounts.map((c) => [c._id.toString(), { total: c.total, done: c.done }]),
  );
  const projectProgress = accessibleProjects
    .map((p) => {
      const c = countByProject.get(p._id.toString()) ?? { total: 0, done: 0 };
      const progress = c.total > 0 ? Math.round((c.done / c.total) * 100) : 0;
      return {
        id: p._id.toString(),
        name: p.name,
        status: p.status,
        total: c.total,
        done: c.done,
        progress,
      };
    })
    .sort((a, b) => b.total - a.total);

  // Activity over last 14 days, scoped to user's projects
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - (DAYS - 1));
  since.setUTCHours(0, 0, 0, 0);

  const activityAgg = await Activity.aggregate<{ _id: string; count: number }>([
    {
      $match: {
        $or: [{ projectId: { $in: projectIds } }, { actorId: me }],
        createdAt: { $gte: since },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
  ]);
  const byDay = new Map(activityAgg.map((a) => [a._id, a.count]));

  // Fill in missing days with 0
  const activityByDay: { date: string; count: number; label: string }[] = [];
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = startOfDay(new Date());
    d.setUTCDate(d.getUTCDate() - i);
    const key = formatDay(d);
    activityByDay.push({
      date: key,
      count: byDay.get(key) ?? 0,
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    });
  }

  return NextResponse.json({
    tasksByStatus,
    tasksByPriority,
    projectProgress,
    activityByDay,
  });
}
