import { z } from "zod";
import { ROLES } from "@/lib/auth/roles";

export const signupSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().email("Invalid email").transform((v) => v.toLowerCase().trim()),
  password: z.string().min(6, "Password must be at least 6 characters").max(120),
  role: z.enum(ROLES).optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email").transform((v) => v.toLowerCase().trim()),
  password: z.string().min(1, "Password is required"),
});

export const updateRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(ROLES),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
