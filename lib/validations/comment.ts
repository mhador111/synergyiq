import { z } from "zod";

export const commentCreateSchema = z.object({
  taskId: z.string().min(1),
  body: z.string().trim().min(1, "Comment cannot be empty").max(2000),
});

export type CommentCreateInput = z.infer<typeof commentCreateSchema>;
