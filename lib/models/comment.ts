import mongoose, { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const commentSchema = new Schema(
  {
    taskId: { type: Schema.Types.ObjectId, ref: "Task", required: true, index: true },
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    body: { type: String, required: true, trim: true, maxlength: 2000 },
  },
  { timestamps: true },
);

export type CommentDoc = InferSchemaType<typeof commentSchema> & { _id: mongoose.Types.ObjectId };
export const Comment: Model<CommentDoc> =
  (models.Comment as Model<CommentDoc>) ?? model<CommentDoc>("Comment", commentSchema);
