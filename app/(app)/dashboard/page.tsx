import { auth } from "@/lib/auth/auth";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardStat } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CheckSquare, FolderKanban, Clock, TrendingUp, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/mongoose";
import { Project } from "@/lib/models/project";
import { Task } from "@/lib/models/task";
import { Activity } from "@/lib/models/activity";
import { User } from "@/lib/models/user";
import { timeAgo } from "@/lib/utils/format";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    // Layout should have already redirected; this is a defensive guard.
    return null;
  }
  const userId = session.user.id;
  const firstName = session.user.name?.split(" ")[0] ?? "there";

  await connectDB();
  const [activeProjects, myOpenTasks, myCompletedTasks] = await Promise.all([
    Project.countDocuments({
      $or: [{ ownerId: userId }, { memberIds: userId }],
      status: "active",
    }),
    Task.countDocuments({ assigneeId: userId, status: { $in: ["todo", "in_progress"] } }),
    Task.countDocuments({ assigneeId: userId, status: "completed" }),
  ]);

  const recentProjectsRaw = await Project.find({
    $or: [{ ownerId: userId }, { memberIds: userId }],
  })
    .sort({ updatedAt: -1 })
    .limit(4)
    .select("name status deadline")
    .lean();
  const recentProjects = recentProjectsRaw as Array<{
    _id: mongoose.Types.ObjectId;
    name: string;
    status: "active" | "completed" | "on_hold";
    deadline?: Date;
  }>;

  const accessibleProjectIds = await Project.find({
    $or: [{ ownerId: userId }, { memberIds: userId }],
  })
    .select("_id")
    .lean();
  const recentActivities = await Activity.find({
    $or: [
      { projectId: { $in: accessibleProjectIds.map((p) => p._id) } },
      { actorId: userId },
    ],
  })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();
  const activityActors = await User.find(
    { _id: { $in: Array.from(new Set(recentActivities.map((a) => a.actorId.toString()))) } },
    { name: 1 },
  ).lean();
  const actorNameById = new Map(activityActors.map((u) => [u._id.toString(), u.name]));

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Welcome, ${firstName} 👋`}
        description="Here's what's happening with your work today."
        actions={
          <Link href="/projects/new">
            <Button leftIcon={<Plus className="h-4 w-4" />}>New project</Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <CardStat label="Active projects" value={activeProjects} icon={<FolderKanban className="h-4 w-4" />} />
        <CardStat label="My open tasks" value={myOpenTasks} icon={<CheckSquare className="h-4 w-4" />} />
        <CardStat label="Completed tasks" value={myCompletedTasks} icon={<TrendingUp className="h-4 w-4" />} trend={{ value: "+12% this week", up: true }} />
        <CardStat label="Hours logged" value="—" icon={<Clock className="h-4 w-4" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <div className="px-5 pt-5 pb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold">Recent projects</h2>
            <Link href="/projects" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          <div className="px-5 pb-5 space-y-2">
            {recentProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No projects yet — create your first one to get started.</p>
            ) : (
              recentProjects.map((p) => (
                <Link key={p._id.toString()} href={`/projects/${p._id.toString()}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors">
                  <div className="min-w-0">
                    <div className="font-medium text-foreground truncate">{p.name}</div>
                    {p.deadline && <div className="text-xs text-muted-foreground">Due {new Date(p.deadline).toLocaleDateString()}</div>}
                  </div>
                  <Badge variant={p.status === "active" ? "primary" : p.status === "completed" ? "success" : "warning"}>
                    {p.status.replace("_", " ")}
                  </Badge>
                </Link>
              ))
            )}
          </div>
        </Card>

        <Card>
          <div className="px-5 pt-5 pb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold">Activity</h2>
            <Link href="/activity" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          <div className="px-5 pb-5 space-y-3 text-sm">
            {recentActivities.length === 0 ? (
              <p className="text-muted-foreground text-center py-6">No recent activity yet.</p>
            ) : (
              recentActivities.map((a) => (
                <Link
                  key={a._id.toString()}
                  href={a.projectId ? `/projects/${a.projectId.toString()}${a.taskId ? `?taskId=${a.taskId.toString()}` : ""}` : "/activity"}
                  className="block rounded-lg p-2 hover:bg-muted transition-colors"
                >
                  <p className="text-foreground line-clamp-2">
                    <span className="font-medium">{actorNameById.get(a.actorId.toString()) ?? "Someone"}</span>{" "}
                    {a.message}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{timeAgo(a.createdAt)}</p>
                </Link>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
