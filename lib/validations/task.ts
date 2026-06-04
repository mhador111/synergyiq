import { z } from "zod";
import { PRIORITIES, TASK_STATUSES } from "@/lib/models/task";

const futureDate = z
  .coerce
  .date({ message: "Please select a valid deadline" })
  .refine((d) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d.getTime() >= today.getTime();
  }, { message: "Please select a valid deadline" });

export const taskCreateSchema = z.object({
  projectId: z.string().min(1, "Project is required"),
  title: z.string().trim().min(2, "Task title is too short").max(160),
  description: z.string().trim().max(4000).default(""),
  assigneeId: z.string().nullable().optional().default(null),
  dueDate: futureDate,
  priority: z.enum(PRIORITIES).default("medium"),
  status: z.enum(TASK_STATUSES).default("todo"),
});

export const taskUpdateSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(2).max(160).optional(),
  description: z.string().trim().max(4000).optional(),
  assigneeId: z.string().nullable().optional(),
  dueDate: futureDate.optional(),
  priority: z.enum(PRIORITIES).optional(),
  status: z.enum(TASK_STATUSES).optional(),
});

export const taskStatusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(TASK_STATUSES),
});

export const taskIdSchema = z.object({
  id: z.string().min(1, "Task id is required"),
});

export const taskAssignSchema = z.object({
  id: z.string().min(1, "Task id is required"),
  assigneeId: z.string().nullable(),
});

export type TaskCreateInput = z.infer<typeof taskCreateSchema>;
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;
export type TaskStatusInput = z.infer<typeof taskStatusSchema>;
export type TaskAssignInput = z.infer<typeof taskAssignSchema>;
