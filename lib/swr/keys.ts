export const swrKeys = {
  projects: (params: Record<string, unknown> = {}) => ["projects", params] as const,
  project: (id: string) => ["project", id] as const,
  tasks: (params: Record<string, unknown> = {}) => ["tasks", params] as const,
  task: (id: string) => ["task", id] as const,
  members: (params: Record<string, unknown> = {}) => ["members", params] as const,
  activity: (limit = 10) => ["activity", limit] as const,
  notifications: () => ["notifications"] as const,
  comments: (taskId: string) => ["comments", taskId] as const,
  analytics: () => ["analytics"] as const,
} as const;
