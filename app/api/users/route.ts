import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongoose";
import { User } from "@/lib/models/user";
import { Project } from "@/lib/models/project";
import { Task } from "@/lib/models/task";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const users = await User.find({}, { passwordHash: 0 })
    .sort({ name: 1 })
    .lean();

  // For each user, compute: openTasks, completedTasks, projectCount, isActive
  const userIds = users.map((u) => u._id);
  const [taskAgg, projectCounts] = await Promise.all([
    Task.aggregate([
      { $match: { assigneeId: { $in: userIds } } },
      {
        $group: {
          _id: { user: "$assigneeId", status: "$status" },
          count: { $sum: 1 },
        },
      },
    ]),
    Project.aggregate([
      { $match: { memberIds: { $in: userIds } } },
      { $unwind: "$memberIds" },
      { $match: { memberIds: { $in: userIds } } },
      { $group: { _id: "$memberIds", count: { $sum: 1 } } },
    ]),
  ]);

  const taskMap = new Map<string, { open: number; completed: number }>();
  for (const row of taskAgg) {
    const userId = String(row._id.user);
    const status = row._id.status;
    const current = taskMap.get(userId) ?? { open: 0, completed: 0 };
    if (status === "completed") current.completed += row.count;
    else current.open += row.count;
    taskMap.set(userId, current);
  }

  const projectMap = new Map<string, number>();
  for (const row of projectCounts) {
    projectMap.set(String(row._id), row.count);
  }

  const now = Date.now();
  const ACTIVE_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

  return NextResponse.json({
    users: users.map((u) => {
      const tasks = taskMap.get(String(u._id)) ?? { open: 0, completed: 0 };
      const projectCount = projectMap.get(String(u._id)) ?? 0;
      const lastActive = u.lastActiveAt ? new Date(u.lastActiveAt).getTime() : 0;
      const isActive = now - lastActive < ACTIVE_WINDOW_MS;
      return {
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        role: u.role,
        avatarColor: u.avatarColor,
        createdAt: u.createdAt,
        lastActiveAt: u.lastActiveAt ?? null,
        isActive,
        openTasks: tasks.open,
        completedTasks: tasks.completed,
        projectCount,
      };
    }),
  });
}
