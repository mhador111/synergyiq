import { NextResponse, type NextRequest } from "next/server";
import mongoose from "mongoose";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongoose";
import { Project } from "@/lib/models/project";
import { Task } from "@/lib/models/task";
import { Comment } from "@/lib/models/comment";
import { User } from "@/lib/models/user";

export const dynamic = "force-dynamic";

const MAX_RESULTS_PER_GROUP = 5;
const MIN_QUERY_LENGTH = 2;

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  if (q.length < MIN_QUERY_LENGTH) {
    return NextResponse.json({ q, projects: [], tasks: [], users: [] });
  }

  await connectDB();
  const me = new mongoose.Types.ObjectId(session.user.id);
  const rx = new RegExp(escapeRegex(q), "i");

  // Projects the user can see, filtered by name/description
  const projectDocs = await Project.find({
    $and: [
      { $or: [{ ownerId: me }, { memberIds: me }] },
      { $or: [{ name: rx }, { description: rx }] },
    ],
  })
    .sort({ updatedAt: -1 })
    .limit(MAX_RESULTS_PER_GROUP)
    .lean();

  // Tasks in those projects matching title/description
  const projectIds = projectDocs.map((p) => p._id);
  const taskDocs = await Task.find({
    projectId: { $in: projectIds },
    $or: [{ title: rx }, { description: rx }],
  })
    .sort({ updatedAt: -1 })
    .limit(MAX_RESULTS_PER_GROUP)
    .lean();

  // Comments in those projects' tasks matching body
  const taskIds = taskDocs.map((t) => t._id);
  const projectTaskIds = await Task.find({ projectId: { $in: projectIds } })
    .select("_id")
    .lean();
  const allTaskIds = [
    ...new Set([...taskIds, ...projectTaskIds.map((t) => t._id)]),
  ];
  const commentDocs = allTaskIds.length
    ? await Comment.find({ taskId: { $in: allTaskIds }, body: rx })
        .sort({ createdAt: -1 })
        .limit(MAX_RESULTS_PER_GROUP)
        .lean()
    : [];

  // Users (members of any project the caller can see, or all for admins)
  const userDocs = await User.find({
    $or: [{ name: rx }, { email: rx }],
  })
    .select("name email role avatarColor")
    .limit(MAX_RESULTS_PER_GROUP)
    .lean();

  // Build a project name lookup for task/comment hydration
  const allProjectIds = [
    ...new Set([
      ...projectIds,
      ...taskDocs.map((t) => t.projectId),
      ...projectTaskIds.map((t) => t.projectId),
    ]),
  ];
  const allProjects = allProjectIds.length
    ? await Project.find({ _id: { $in: allProjectIds } })
        .select("name")
        .lean()
    : [];
  const projectNameById = new Map(
    allProjects.map((p) => [p._id.toString(), p.name]),
  );

  const projects = projectDocs.map((p) => ({
    id: p._id.toString(),
    name: p.name,
    description: p.description ?? "",
    status: p.status,
  }));

  const tasks = taskDocs.map((t) => ({
    id: t._id.toString(),
    title: t.title,
    status: t.status,
    priority: t.priority,
    projectId: t.projectId.toString(),
    projectName: projectNameById.get(t.projectId.toString()) ?? null,
  }));

  const comments = commentDocs.map((c) => ({
    id: c._id.toString(),
    body: c.body,
    taskId: c.taskId.toString(),
    createdAt: c.createdAt,
  }));

  const users = userDocs.map((u) => ({
    id: u._id.toString(),
    name: u.name,
    email: u.email,
    role: u.role,
    avatarColor: u.avatarColor,
  }));

  return NextResponse.json({ q, projects, tasks, comments, users });
}
