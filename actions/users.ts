"use server";

import { revalidatePath } from "next/cache";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/mongoose";
import { User } from "@/lib/models/user";
import { auth } from "@/lib/auth/auth";
import { ROLES, type Role } from "@/lib/auth/roles";
import { hasRole } from "@/lib/auth/rbac";
import { logActivity } from "@/lib/utils/activity";
import { ok, fail, type Result } from "@/lib/utils/result";

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return {
    id: session.user.id,
    role: (session.user.role ?? "member") as Role,
    name: session.user.name ?? "Someone",
  };
}

export async function changeUserRole(
  userId: string,
  newRole: Role,
): Promise<Result<{ id: string; role: Role }>> {
  const me = await requireUser();
  if (!me) return fail("You must be signed in.");
  if (!hasRole(me.role, "admin")) {
    return fail("Only admins can change user roles");
  }
  if (!mongoose.isValidObjectId(userId)) return fail("Invalid user id");
  if (!ROLES.includes(newRole)) return fail("Invalid role");

  await connectDB();
  const target = await User.findById(userId).select("name role").lean();
  if (!target) return fail("User not found");

  if (String(target._id) === me.id && newRole !== "admin") {
    return fail("You cannot demote yourself");
  }

  const oldRole = target.role;
  if (oldRole === newRole) return ok({ id: userId, role: newRole });

  await User.updateOne({ _id: userId }, { $set: { role: newRole } });

  await logActivity({
    type: "member_added",
    message: `Changed ${target.name}'s role from "${oldRole}" to "${newRole}"`,
    actorId: me.id,
  });

  revalidatePath("/team");
  return ok({ id: userId, role: newRole });
}
