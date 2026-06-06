import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongoose";
import { Notification } from "@/lib/models/notification";

export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const url = new URL(req.url);
  const limitParam = url.searchParams.get("limit");
  const limit = Math.min(Math.max(parseInt(limitParam ?? "50", 10) || 50, 1), 100);

  await connectDB();
  const me = new mongoose.Types.ObjectId(session.user.id);

  const [docs, unreadCount] = await Promise.all([
    Notification.find({ userId: me }).sort({ createdAt: -1 }).limit(limit).lean(),
    Notification.countDocuments({ userId: me, read: false }),
  ]);

  return NextResponse.json({
    notifications: docs.map((d) => ({
      id: d._id.toString(),
      userId: d.userId.toString(),
      title: d.title,
      body: d.body,
      link: d.link ?? null,
      read: d.read,
      createdAt: d.createdAt.toISOString(),
    })),
    unreadCount,
  });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return badRequest("Invalid JSON body");
  }
  const body = json as { id?: string; all?: boolean };

  await connectDB();
  const me = new mongoose.Types.ObjectId(session.user.id);

  if (body.all === true) {
    const res = await Notification.updateMany(
      { userId: me, read: false },
      { $set: { read: true } },
    );
    return NextResponse.json({ ok: true, count: res.modifiedCount ?? 0 });
  }

  if (!body.id || !mongoose.isValidObjectId(body.id)) {
    return badRequest("Invalid id");
  }
  const res = await Notification.updateOne(
    { _id: new mongoose.Types.ObjectId(body.id), userId: me },
    { $set: { read: true } },
  );
  if (res.matchedCount === 0) {
    return NextResponse.json({ error: "Notification not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, id: body.id });
}
