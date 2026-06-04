"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDays, FolderKanban, ListChecks, Loader2, X } from "lucide-react";
import toast from "react-hot-toast";

import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Skeleton } from "@/components/ui/Skeleton";
import { createProject } from "@/actions/projects";
import { projectCreateSchema, type ProjectCreateInput } from "@/lib/validations/project";
import { PROJECT_STATUSES, type ProjectStatus } from "@/lib/auth/roles";
import { useUsers, revalidateProjects } from "@/hooks/useProjects";

const statusLabel: Record<ProjectStatus, string> = {
  active: "Active",
  completed: "Completed",
  on_hold: "On hold",
};

export function NewProjectForm() {
  const router = useRouter();
  const { users, isLoading: usersLoading } = useUsers();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProjectCreateInput>({
    resolver: zodResolver(projectCreateSchema),
    defaultValues: {
      name: "",
      description: "",
      status: "active",
      memberIds: [],
    },
  });

  const selectedMembers = watch("memberIds") ?? [];

  function toggleMember(id: string) {
    const next = selectedMembers.includes(id)
      ? selectedMembers.filter((m) => m !== id)
      : [...selectedMembers, id];
    setValue("memberIds", next, { shouldValidate: true, shouldDirty: true });
  }

  async function onSubmit(data: ProjectCreateInput) {
    setSubmitting(true);
    const res = await createProject({
      name: data.name,
      description: data.description ?? "",
      status: data.status,
      deadline: data.deadline,
      memberIds: data.memberIds ?? [],
    });
    setSubmitting(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Project created!");
    await revalidateProjects();
    router.push(`/projects/${res.data.id}`);
    router.refresh();
  }

  const statusOptions = PROJECT_STATUSES.map((s) => ({ value: s, label: statusLabel[s] }));

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="New project"
        description="Create a project to organize tasks and collaborate with your team."
        backHref="/projects"
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderKanban className="h-4 w-4 text-primary" /> Project details
            </CardTitle>
            <CardDescription>Give your project a clear name and a short description.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Project name"
              placeholder="e.g. Marketing site redesign"
              error={errors.name?.message}
              {...register("name")}
            />
            <Textarea
              label="Description"
              placeholder="What is this project about? (optional)"
              rows={4}
              error={errors.description?.message}
              {...register("description")}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-primary" /> Status &amp; timeline
            </CardTitle>
            <CardDescription>Pick a status and an optional deadline.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Status"
              options={statusOptions}
              error={errors.status?.message}
              {...register("status")}
            />
            <Input
              type="date"
              label="Deadline"
              leftIcon={<CalendarDays className="h-4 w-4" />}
              error={errors.deadline?.message}
              {...register("deadline")}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Team members</CardTitle>
            <CardDescription>You will be added as the owner automatically.</CardDescription>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : users.length === 0 ? (
              <p className="text-sm text-muted-foreground">No teammates found.</p>
            ) : (
              <ul className="divide-y divide-border -mx-5">
                {users.map((u) => {
                  const checked = selectedMembers.includes(u.id);
                  return (
                    <li key={u.id}>
                      <label className="flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-muted/50 transition-colors">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleMember(u.id)}
                          className="h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-primary/30"
                        />
                        <Avatar name={u.name} />
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-foreground truncate">{u.name}</div>
                          <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                        </div>
                        <span className="ml-auto text-xs uppercase tracking-wide text-muted-foreground">{u.role}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
            {errors.memberIds?.message && (
              <p className="mt-2 text-xs text-danger">{errors.memberIds.message}</p>
            )}

            {selectedMembers.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {selectedMembers.map((id) => {
                  const u = users.find((x) => x.id === id);
                  if (!u) return null;
                  return (
                    <button
                      type="button"
                      key={id}
                      onClick={() => toggleMember(id)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-medium hover:bg-primary/15"
                    >
                      {u.name}
                      <X className="h-3 w-3" />
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="ghost" onClick={() => router.push("/projects")}>
            Cancel
          </Button>
          <Button type="submit" isLoading={submitting} leftIcon={!submitting ? <FolderKanban className="h-4 w-4" /> : <Loader2 className="h-4 w-4 animate-spin" />}>
            Create project
          </Button>
        </div>
      </form>
    </div>
  );
}
