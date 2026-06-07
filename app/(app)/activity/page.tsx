import Link from "next/link";
import mongoose from "mongoose";
import {
  Activity as ActivityIcon,
  CheckSquare,
  FolderKanban,
  MessageCircle,
  UserPlus,
} from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongoose";
import { Activity, type ActivityType } from "@/lib/models/activity";
import { Project } from "@/lib/models/project";
import { Task } from "@/lib/models/task";
import { User } from "@/lib/models/user";
import { PageHeader } from "@/components/layout/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDateTime, timeAgo } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export const dynamic = "force-dynamic";

type ActivityItem = {
  id: string;
  type: ActivityType;
  message: string;
  createdAt: Date;
  actorName: string;
  projectName: string | null;
  taskTitle: string | null;
  href: string | null;
};

const typeMeta: Record<
  ActivityType,
  {
    label: string;
    variant: "primary" | "success" | "warning" | "danger" | "info" | "neutral";
    icon: typeof ActivityIcon;
  }
> = {
  project_created: { label: "Project", variant: "success", icon: FolderKanban },
  project_updated: { label: "Project", variant: "primary", icon: FolderKanban },
  project_deleted: { label: "Project", variant: "danger", icon: FolderKanban },
  task_created: { label: "Task", variant: "success", icon: CheckSquare },
  task_updated: { label: "Task", variant: "primary", icon: CheckSquare },
  task_status_changed: { label: "Task", variant: "warning", icon: CheckSquare },
  task_assigned: { label: "Task", variant: "info", icon: CheckSquare },
  task_deleted: { label: "Task", variant: "danger", icon: CheckSquare },
  member_added: { label: "Member", variant: "info", icon: UserPlus },
  member_removed: { label: "Member", variant: "danger", icon: UserPlus },
  comment_added: { label: "Comment", variant: "neutral", icon: MessageCircle },
};

async function loadActivity(userId: string): Promise<ActivityItem[]> {
  await connectDB();
  const me = new mongoose.Types.ObjectId(userId);

  const accessibleProjects = await Project.find({
    $or: [{ ownerId: me }, { memberIds: me }],
  })
    .select("_id")
    .lean();
  const projectIds = accessibleProjects.map((p) => p._id);

  const docs = await Activity.find({
    $or: [{ projectId: { $in: projectIds } }, { actorId: me }],
  })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  const actorIds = Array.from(new Set(docs.map((a) => a.actorId.toString())));
  const activityProjectIds = Array.from(
    new Set(docs.map((a) => a.projectId?.toString()).filter(Boolean)),
  );
  const taskIds = Array.from(
    new Set(docs.map((a) => a.taskId?.toString()).filter(Boolean)),
  );

  const [actors, projects, tasks] = await Promise.all([
    User.find({ _id: { $in: actorIds } }, { name: 1 }).lean(),
    Project.find({ _id: { $in: activityProjectIds } }, { name: 1 }).lean(),
    Task.find({ _id: { $in: taskIds } }, { title: 1 }).lean(),
  ]);

  const actorMap = new Map(actors.map((u) => [u._id.toString(), u.name]));
  const projectMap = new Map(projects.map((p) => [p._id.toString(), p.name]));
  const taskMap = new Map(tasks.map((t) => [t._id.toString(), t.title]));

  return docs.map((a) => {
    const projectId = a.projectId?.toString() ?? null;
    const taskId = a.taskId?.toString() ?? null;
    return {
      id: a._id.toString(),
      type: a.type,
      message: a.message,
      createdAt: a.createdAt,
      actorName: actorMap.get(a.actorId.toString()) ?? "Someone",
      projectName: projectId ? projectMap.get(projectId) ?? "Deleted project" : null,
      taskTitle: taskId ? taskMap.get(taskId) ?? "Deleted task" : null,
      href: projectId ? `/projects/${projectId}${taskId ? `?taskId=${taskId}` : ""}` : null,
    };
  });
}

export default async function ActivityPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const activities = await loadActivity(session.user.id);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Activity"
        description="A timeline of project, task, member, and comment changes you can see."
      />

      {activities.length === 0 ? (
        <EmptyState
          icon={<ActivityIcon className="h-8 w-8" />}
          title="No activity yet"
          description="Project and task changes will appear here once your team starts working."
        />
      ) : (
        <Card className="overflow-hidden">
          <ol className="divide-y divide-border">
            {activities.map((item) => (
              <ActivityRow key={item.id} item={item} />
            ))}
          </ol>
        </Card>
      )}
    </div>
  );
}

function ActivityRow({ item }: { item: ActivityItem }) {
  const meta = typeMeta[item.type];
  const Icon = meta.icon;
  const content = (
    <div className="flex gap-3 px-4 py-3 transition-colors hover:bg-muted/60">
      <div className="pt-0.5">
        <Avatar name={item.actorName} size="sm" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={meta.variant}>
            <Icon className="h-3 w-3" />
            {meta.label}
          </Badge>
          <span
            className="text-xs text-muted-foreground"
            title={formatDateTime(item.createdAt)}
          >
            {timeAgo(item.createdAt)}
          </span>
        </div>
        <p className="mt-1 text-sm text-foreground break-words">
          <span className="font-medium">{item.actorName}</span>{" "}
          <span>{item.message}</span>
        </p>
        {(item.projectName || item.taskTitle) && (
          <p className="mt-1 text-xs text-muted-foreground truncate">
            {item.projectName}
            {item.projectName && item.taskTitle ? " / " : ""}
            {item.taskTitle}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <li className={cn(item.href && "cursor-pointer")}>
      {item.href ? (
        <Link href={item.href} className="block">
          {content}
        </Link>
      ) : (
        content
      )}
    </li>
  );
}
