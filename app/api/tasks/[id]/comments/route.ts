import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongoose";
import { Task } from "@/lib/models/task";
import { Project } from "@/lib/models/project";
import { Comment } from "@/lib/models/comment";
import { User } from "@/lib/models/user";
import { logActivity } from "@/lib/utils/activity";
import { commentCreateSchema } from "@/lib/validations/comment";
import { notifyMany } from "@/actions/notifications";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}
function forbidden() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
function notFound(message = "Not found") {
  return NextResponse.json({ error: message }, { status: 404 });
}

export async function GET(_req: Request, ctx: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();
  const { id: taskId } = await ctx.params;
  if (!mongoose.isValidObjectId(taskId)) return badRequest("Invalid task id");

  await connectDB();
  const me = new mongoose.Types.ObjectId(session.user.id);

  const task = await Task.findById(taskId)
    .select("projectId title assigneeId createdBy")
    .lean();
  if (!task) return notFound("Task not found");

  const project = await Project.findById(task.projectId).lean();
  if (!project) return notFound("Project not found");

  const isMember =
    project.ownerId.toString() === me.toString() ||
    project.memberIds.some((m) => m.toString() === me.toString());
  if (!isMember) return forbidden();

  const comments = await Comment.find({ taskId })
    .sort({ createdAt: 1 })
    .lean();

  const authorIds = Array.from(
    new Set(comments.map((c) => c.authorId.toString())),
  );
  const authors = await User.find(
    { _id: { $in: authorIds } },
    { name: 1, avatarColor: 1 },
  ).lean();
  const authorMap = new Map(authors.map((u) => [u._id.toString(), u]));

  return NextResponse.json({
    comments: comments.map((c) => {
      const a = authorMap.get(c.authorId.toString());
      return {
        id: c._id.toString(),
        taskId: c.taskId.toString(),
        body: c.body,
        authorId: c.authorId.toString(),
        authorName: a?.name ?? "Unknown",
        authorColor: a?.avatarColor ?? "indigo",
        createdAt: c.createdAt,
      };
    }),
  });
}

export async function POST(req: Request, ctx: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();
  const { id: taskId } = await ctx.params;
  if (!mongoose.isValidObjectId(taskId)) return badRequest("Invalid task id");

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return badRequest("Invalid JSON body");
  }
  const parsed = commentCreateSchema.safeParse({ ...(json as object), taskId });
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  await connectDB();
  const me = new mongoose.Types.ObjectId(session.user.id);

  const task = await Task.findById(taskId)
    .select("projectId title assigneeId createdBy")
    .lean();
  if (!task) return notFound("Task not found");

  const project = await Project.findById(task.projectId).lean();
  if (!project) return notFound("Project not found");

  const isMember =
    project.ownerId.toString() === me.toString() ||
    project.memberIds.some((m) => m.toString() === me.toString());
  if (!isMember) return forbidden();

  const comment = await Comment.create({
    taskId,
    authorId: me.toString(),
    body: parsed.data.body,
  });

  await logActivity({
    type: "comment_added",
    message: `Commented on "${task.title}"`,
    actorId: me.toString(),
    projectId: task.projectId.toString(),
    taskId,
  });

  await notifyMany({
    userIds: [
      task.assigneeId ? String(task.assigneeId) : null,
      task.createdBy ? String(task.createdBy) : null,
    ],
    title: "New comment on task",
    body: `"${task.title}"`,
    link: `/projects/${task.projectId.toString()}?taskId=${taskId}`,
    excludeUserId: me.toString(),
  });

  const author = await User.findById(me, { name: 1, avatarColor: 1 }).lean();

  return NextResponse.json(
    {
      comment: {
        id: comment._id.toString(),
        taskId,
        body: comment.body,
        authorId: me.toString(),
        authorName: author?.name ?? "Unknown",
        authorColor: author?.avatarColor ?? "indigo",
        createdAt: comment.createdAt,
      },
    },
    { status: 201 },
  );
}
