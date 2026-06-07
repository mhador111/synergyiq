"use client";

import { useMemo, useState } from "react";
import { Shield, Circle, CheckCircle2, FolderKanban } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Skeleton } from "@/components/ui/Skeleton";
import { useTeam, type TeamMember } from "@/hooks/useTeam";
import { useSession } from "next-auth/react";
import { ROLES, type Role } from "@/lib/auth/roles";
import { timeAgo } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

const roleVariant: Record<Role, "primary" | "success" | "muted"> = {
  admin: "primary",
  manager: "success",
  member: "muted",
};

export default function TeamPage() {
  const { members, isLoading, changeRole } = useTeam();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return members;
    const q = search.toLowerCase();
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.role.includes(q),
    );
  }, [members, search]);

  const columns: Column<TeamMember>[] = [
    {
      key: "name",
      header: "Member",
      accessor: (m) => m.name,
      render: (m) => (
        <div className="flex items-center gap-3">
          <Avatar name={m.name} size="sm" />
          <div>
            <div className="font-medium text-foreground">{m.name}</div>
            <div className="text-xs text-muted-foreground">{m.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      accessor: (m) => m.role,
      render: (m) =>
        isAdmin && m.id !== session?.user?.id ? (
          <select
            value={m.role}
            onChange={(e) => changeRole(m.id, e.target.value as Role)}
            className={cn(
              "text-xs font-medium px-2 py-1 rounded-md border border-border bg-surface-elevated",
              "focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer",
            )}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </option>
            ))}
          </select>
        ) : (
          <Badge variant={roleVariant[m.role]}>
            {m.role.charAt(0).toUpperCase() + m.role.slice(1)}
          </Badge>
        ),
    },
    {
      key: "status",
      header: "Status",
      accessor: (m) => (m.isActive ? "active" : "offline"),
      render: (m) => (
        <span className="inline-flex items-center gap-1.5 text-xs">
          <Circle
            className={cn(
              "h-2 w-2",
              m.isActive ? "fill-success text-success" : "fill-muted-foreground/40 text-muted-foreground/40",
            )}
          />
          {m.isActive ? "Active" : "Offline"}
        </span>
      ),
    },
    {
      key: "workload",
      header: "Workload",
      accessor: (m) => m.openTasks,
      render: (m) => (
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Shield className="h-3 w-3" /> {m.openTasks} open
          </span>
          <span className="inline-flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> {m.completedTasks} done
          </span>
        </div>
      ),
    },
    {
      key: "projects",
      header: "Projects",
      accessor: (m) => m.projectCount,
      render: (m) => (
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <FolderKanban className="h-3 w-3" /> {m.projectCount}
        </span>
      ),
    },
    {
      key: "lastActive",
      header: "Last active",
      accessor: (m) => m.lastActiveAt ?? "",
      render: (m) => (
        <span className="text-xs text-muted-foreground">
          {m.isActive ? "Now" : m.lastActiveAt ? timeAgo(m.lastActiveAt) : "—"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team"
        description="Manage team members, roles, and workload."
      />

      <div className="mb-4">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or role…"
          className="w-full max-w-sm h-9 px-3 rounded-lg bg-muted/60 border border-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:bg-surface-elevated focus:border-border focus:ring-2 focus:ring-ring/20"
        />
      </div>

      <DataTable
        data={isLoading ? undefined : filtered}
        columns={columns}
        rowKey={(m) => m.id}
        isLoading={isLoading}
        emptyState={{
          icon: <Shield className="h-8 w-8" />,
          title: "No team members",
          description: "Team members will appear here once they sign up.",
        }}
      />
    </div>
  );
}
