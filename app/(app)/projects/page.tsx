"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, FolderKanban, MoreVertical, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Dropdown, DropdownItem, DropdownSeparator } from "@/components/ui/Dropdown";
import { useProjects, type ProjectListItem } from "@/hooks/useProjects";
import { deleteProject } from "@/actions/projects";
import { PROJECT_STATUSES, type ProjectStatus } from "@/lib/auth/roles";
import toast from "react-hot-toast";

const statusVariant: Record<ProjectStatus, "primary" | "success" | "warning"> = {
  active: "primary",
  completed: "success",
  on_hold: "warning",
};

const statusLabel: Record<ProjectStatus, string> = {
  active: "Active",
  completed: "Completed",
  on_hold: "On hold",
};

export default function ProjectsPage() {
  const router = useRouter();
  const { projects, isLoading, revalidate } = useProjects();
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all">("all");

  const filtered = useMemo(() => {
    if (statusFilter === "all") return projects;
    return projects.filter((p) => p.status === statusFilter);
  }, [projects, statusFilter]);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete project "${name}"? This will also delete all its tasks.`)) return;
    const res = await deleteProject(id);
    if (res.ok) {
      toast.success("Project deleted");
      await revalidate();
    } else {
      toast.error(res.error);
    }
  }

  const columns: Column<ProjectListItem>[] = [
    {
      key: "name",
      header: "Project",
      accessor: (p) => p.name,
      render: (p) => (
        <Link href={`/projects/${p.id}`} className="block group">
          <div className="font-medium text-foreground group-hover:text-primary transition-colors">{p.name}</div>
          {p.deadline && (
            <div className="text-xs text-muted-foreground mt-0.5">
              Due {new Date(p.deadline).toLocaleDateString()}
            </div>
          )}
        </Link>
      ),
    },
    {
      key: "status",
      header: "Status",
      accessor: (p) => p.status,
      render: (p) => <Badge variant={statusVariant[p.status]}>{statusLabel[p.status]}</Badge>,
    },
    {
      key: "tasks",
      header: "Tasks",
      accessor: (p) => p.taskCount,
      render: (p) => (
        <span className="text-sm text-muted-foreground">
          {p.completedCount}/{p.taskCount}
        </span>
      ),
    },
    {
      key: "members",
      header: "Members",
      accessor: (p) => p.memberIds.length,
      render: (p) => <span className="text-sm text-muted-foreground">{p.memberIds.length}</span>,
    },
    {
      key: "actions",
      header: "",
      sortable: false,
      render: (p) => (
        <Dropdown
          align="right"
          trigger={
            <button className="p-1 rounded-md hover:bg-muted text-muted-foreground" aria-label="Project actions">
              <MoreVertical className="h-4 w-4" />
            </button>
          }
        >
          <DropdownItem onClick={() => router.push(`/projects/${p.id}`)}>View details</DropdownItem>
          <DropdownItem onClick={() => router.push(`/projects/${p.id}#members`)}>Manage members</DropdownItem>
          <DropdownSeparator />
          <DropdownItem danger onClick={() => handleDelete(p.id, p.name)}>
            <Trash2 className="h-4 w-4" /> Delete project
          </DropdownItem>
        </Dropdown>
      ),
      className: "w-12 text-right",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="All projects you own or are a member of."
        actions={
          <Link href="/projects/new">
            <Button leftIcon={<Plus className="h-4 w-4" />}>New project</Button>
          </Link>
        }
      />

      <DataTable
        data={isLoading ? undefined : filtered}
        columns={columns}
        rowKey={(p) => p.id}
        isLoading={isLoading}
        searchPlaceholder="Search projects…"
        globalFilter={(p, term) => p.name.toLowerCase().includes(term)}
        toolbar={
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | "all")}
              className="text-sm bg-transparent border border-border rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="all">All status</option>
              {PROJECT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {statusLabel[s]}
                </option>
              ))}
            </select>
          </div>
        }
        emptyState={{
          icon: <FolderKanban className="h-8 w-8" />,
          title: "No projects found",
          description:
            !isLoading && statusFilter === "all"
              ? "Get started by creating your first project."
              : "Try a different filter or search term.",
          action:
            !isLoading && statusFilter === "all" ? (
              <Link href="/projects/new">
                <Button leftIcon={<Plus className="h-4 w-4" />}>New project</Button>
              </Link>
            ) : undefined,
        }}
      />
    </div>
  );
}
