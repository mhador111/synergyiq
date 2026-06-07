import { z } from "zod";
import { PROJECT_STATUSES } from "@/lib/auth/roles";

const dateInFuture = (msg = "Please select a valid deadline") =>
  z
    .coerce
    .date({ message: msg })
    .refine((d) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return d.getTime() >= today.getTime();
    }, { message: msg });

export const projectCreateSchema = z.object({
  name: z.string().trim().min(2, "Project name is too short").max(120),
  description: z.string().trim().max(2000).default(""),
  deadline: dateInFuture(),
  status: z.enum(PROJECT_STATUSES).default("active"),
  memberIds: z.array(z.string()).default([]),
});

export const projectUpdateSchema = projectCreateSchema.partial().extend({
  id: z.string().min(1, "Project id is required"),
});

export const projectIdSchema = z.object({
  id: z.string().min(1, "Project id is required"),
});

export const addMemberSchema = z.object({
  projectId: z.string().min(1, "Project id is required"),
  userId: z.string().min(1, "User id is required"),
});

export const removeMemberSchema = addMemberSchema;

export type ProjectCreateInput = z.infer<typeof projectCreateSchema>;
export type ProjectUpdateInput = z.infer<typeof projectUpdateSchema>;
