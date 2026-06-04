import mongoose, { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

export const PRIORITIES = ["high", "medium", "low"] as const;
export const TASK_STATUSES = ["todo", "in_progress", "completed"] as const;
export type Priority = (typeof PRIORITIES)[number];
export type TaskStatus = (typeof TASK_STATUSES)[number];

const taskSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    assigneeId: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    dueDate: { type: Date, required: true, index: true },
    priority: { type: String, enum: PRIORITIES, default: "medium", index: true },
    status: { type: String, enum: TASK_STATUSES, default: "todo", index: true },
    position: { type: Number, default: 0, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

// Unique title per project (case-insensitive) — enforces "no duplicate task titles in same project"
taskSchema.index(
  { projectId: 1, title: 1 },
  { unique: true, collation: { locale: "en", strength: 2 } },
);
taskSchema.index({ projectId: 1, status: 1, position: 1 });
taskSchema.index({ title: "text", description: "text" });

export type TaskDoc = InferSchemaType<typeof taskSchema> & { _id: mongoose.Types.ObjectId };
export const Task: Model<TaskDoc> =
  (models.Task as Model<TaskDoc>) ?? model<TaskDoc>("Task", taskSchema);
