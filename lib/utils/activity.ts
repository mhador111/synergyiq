import { connectDB } from "@/lib/db/mongoose";
import { Activity, type ActivityType } from "@/lib/models/activity";

export interface LogActivityInput {
  type: ActivityType;
  actorId: string;
  projectId?: string | null;
  taskId?: string | null;
  targetUserId?: string | null;
  message: string;
}

export async function logActivity(input: LogActivityInput): Promise<void> {
  try {
    await connectDB();
    await Activity.create({
      type: input.type,
      actorId: input.actorId,
      projectId: input.projectId ?? null,
      taskId: input.taskId ?? null,
      targetUserId: input.targetUserId ?? null,
      message: input.message,
    });
  } catch (e) {
    // Activity logging should never break the main operation.
    console.error("[activity] failed to log", e);
  }
}
