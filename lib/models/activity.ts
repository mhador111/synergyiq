import mongoose, { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

export const ACTIVITY_TYPES = [
  "project_created",
  "project_updated",
  "project_deleted",
  "task_created",
  "task_updated",
  "task_status_changed",
  "task_assigned",
  "task_deleted",
  "member_added",
  "member_removed",
  "comment_added",
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

const activitySchema = new Schema(
  {
    type: { type: String, enum: ACTIVITY_TYPES, required: true, index: true },
    actorId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", default: null, index: true },
    taskId: { type: Schema.Types.ObjectId, ref: "Task", default: null, index: true },
    targetUserId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    message: { type: String, required: true },
  },
  { timestamps: true },
);

export type ActivityDoc = InferSchemaType<typeof activitySchema> & { _id: mongoose.Types.ObjectId };
export const Activity: Model<ActivityDoc> =
  (models.Activity as Model<ActivityDoc>) ?? model<ActivityDoc>("Activity", activitySchema);
