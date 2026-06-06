import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { changeUserRole } from "@/actions/users";
import type { Role } from "@/lib/models/user";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: RouteContext) {
  const { id } = await ctx.params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
  }
  const body = (await req.json().catch(() => null)) as { role?: string } | null;
  if (!body?.role) {
    return NextResponse.json({ error: "role is required" }, { status: 400 });
  }

  const result = await changeUserRole(id, body.role as Role);
  if (!result.ok) {
    const status = result.error === "You must be signed in." ? 401 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }
  return NextResponse.json(result.data);
}
