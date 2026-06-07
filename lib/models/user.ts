import mongoose, { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { ROLES } from "@/lib/auth/roles";

export type { Role } from "@/lib/auth/roles";

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ROLES, default: "member", index: true },
    avatarColor: { type: String, default: "primary" },
    lastActiveAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export type UserDoc = InferSchemaType<typeof userSchema> & { _id: mongoose.Types.ObjectId };
export const User: Model<UserDoc> =
  (models.User as Model<UserDoc>) ?? model<UserDoc>("User", userSchema);
