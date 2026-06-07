import mongoose, { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { PROJECT_STATUSES } from "@/lib/auth/roles";

export type { ProjectStatus } from "@/lib/auth/roles";

const projectSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    description: { type: String, default: "" },
    deadline: { type: Date, required: true },
    status: { type: String, enum: PROJECT_STATUSES, default: "active", index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    memberIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true },
);

projectSchema.index({ name: "text", description: "text" });

export type ProjectDoc = InferSchemaType<typeof projectSchema> & { _id: mongoose.Types.ObjectId };
export const Project: Model<ProjectDoc> =
  (models.Project as Model<ProjectDoc>) ?? model<ProjectDoc>("Project", projectSchema);
