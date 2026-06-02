import type { Role } from "@/lib/models/user";

export const ROLES_RANK: Record<Role, number> = {
  admin: 3,
  manager: 2,
  member: 1,
};

export function hasRole(actual: Role | undefined, required: Role): boolean {
  if (!actual) return false;
  return ROLES_RANK[actual] >= ROLES_RANK[required];
}

export function canManageProjects(role: Role | undefined): boolean {
  return hasRole(role, "manager");
}

export function canManageUsers(role: Role | undefined): boolean {
  return hasRole(role, "admin");
}

export function canEditTask(role: Role | undefined, isAssignee: boolean): boolean {
  return hasRole(role, "manager") || isAssignee;
}

export function canDeleteTask(role: Role | undefined): boolean {
  return hasRole(role, "manager");
}
