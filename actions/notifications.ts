"use server";

import { revalidatePath } from "next/cache";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/mongoose";
import { Notification } from "@/lib/models/notification";
import { auth } from "@/lib/auth/auth";
import { ok, fail, type Result } from "@/lib/utils/result";

type SessionUser = { id: string };

async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return { id: session.user.id };
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

/**
 * Create a notification for a single user. Used internally by other actions.
 * Safe to call with `null`/`undefined` userId — it no-ops.
 */
export async function notifyUser(input: {
  userId: string | null | undefined;
  title: string;
  body: string;
  link?: string | null;
}): Promise<void> {
  if (!input.userId) return;
  await connectDB();
  try {
    await Notification.create({
      userId: new mongoose.Types.ObjectId(input.userId),
      title: input.title.slice(0, 140),
      body: input.body.slice(0, 500),
      link: input.link ?? null,
      read: false,
    });
  } catch (err) {
    // Notifications are non-critical — never fail the parent action because of them
    console.error("[notifyUser] failed:", err);
  }
}

/**
 * Send the same notification to many users. Skips nullish ids and de-dupes.
 */
export async function notifyMany(input: {
  userIds: Array<string | null | undefined>;
  title: string;
  body: string;
  link?: string | null;
  excludeUserId?: string | null;
}): Promise<void> {
  const seen = new Set<string>();
  for (const id of input.userIds) {
    if (!id || id === input.excludeUserId || seen.has(id)) continue;
    seen.add(id);
    await notifyUser({
      userId: id,
      title: input.title,
      body: input.body,
      link: input.link,
    });
  }
}

export async function getMyNotifications(
  limit = 50,
): Promise<Result<{ notifications: NotificationItem[]; unreadCount: number }>> {
  const me = await getSessionUser();
  if (!me) return fail("You must be signed in.");

  await connectDB();
  const docs = await Notification.find({ userId: me.id })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  const unreadCount = await Notification.countDocuments({
    userId: me.id,
    read: false,
  });

  return ok({
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

export async function markNotificationRead(
  id: string,
): Promise<Result<{ id: string }>> {
  const me = await getSessionUser();
  if (!me) return fail("You must be signed in.");
  if (!mongoose.isValidObjectId(id)) return fail("Invalid id");

  await connectDB();
  const res = await Notification.updateOne(
    { _id: new mongoose.Types.ObjectId(id), userId: me.id },
    { $set: { read: true } },
  );
  if (res.matchedCount === 0) return fail("Notification not found");

  revalidatePath("/notifications");
  return ok({ id });
}

export async function markAllNotificationsRead(): Promise<Result<{ count: number }>> {
  const me = await getSessionUser();
  if (!me) return fail("You must be signed in.");

  await connectDB();
  const res = await Notification.updateMany(
    { userId: me.id, read: false },
    { $set: { read: true } },
  );
  revalidatePath("/notifications");
  return ok({ count: res.modifiedCount ?? 0 });
}
