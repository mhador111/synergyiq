"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";
import { BarChart3, CheckSquare, AlertCircle, Activity } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAnalytics } from "@/hooks/useAnalytics";

const STATUS_COLORS = {
  todo: "#94a3b8",          // slate-400
  in_progress: "#f59e0b",   // amber-500
  completed: "#10b981",     // emerald-500
} as const;

const PRIORITY_COLORS = {
  high: "#ef4444",          // red-500
  medium: "#f59e0b",        // amber-500
  low: "#94a3b8",           // slate-400
} as const;

const STATUS_LABELS = {
  todo: "To do",
  in_progress: "In progress",
  completed: "Completed",
} as const;

export default function AnalyticsPage() {
  const { data, isLoading } = useAnalytics();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Snapshots of work across the projects you can see."
      />

      {isLoading || !data ? (
        <div className="grid md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-5">
              <Skeleton className="h-4 w-32 mb-4" />
              <Skeleton className="h-64 w-full" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          <TasksByStatusCard
            status={data.tasksByStatus}
          />
          <TasksByPriorityCard
            priority={data.tasksByPriority}
          />
          <ProjectProgressCard
            projects={data.projectProgress}
          />
          <ActivityCard
            days={data.activityByDay}
          />
        </div>
      )}
    </div>
  );
}

function ChartCard({
  title,
  icon,
  empty,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  empty?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-muted-foreground">{icon}</span>
        <h2 className="font-semibold text-foreground">{title}</h2>
      </div>
      <div className="h-64">
        {empty ? (
          <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
            No data yet.
          </div>
        ) : (
          children
        )}
      </div>
    </Card>
  );
}

function TasksByStatusCard({
  status,
}: {
  status: { todo: number; in_progress: number; completed: number };
}) {
  const total = status.todo + status.in_progress + status.completed;
  const data = (Object.keys(STATUS_LABELS) as Array<keyof typeof STATUS_LABELS>).map(
    (k) => ({ name: STATUS_LABELS[k], value: status[k], key: k }),
  );

  return (
    <ChartCard
      title="Tasks by status"
      icon={<CheckSquare className="h-4 w-4" />}
      empty={total === 0}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={50}
            outerRadius={90}
            paddingAngle={2}
          >
            {data.map((entry) => (
              <Cell
                key={entry.key}
                fill={STATUS_COLORS[entry.key]}
                stroke="transparent"
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--surface-elevated)",
              border: "1px solid var(--border)",
              borderRadius: "0.5rem",
              fontSize: "0.75rem",
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            wrapperStyle={{ fontSize: "0.75rem" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function TasksByPriorityCard({
  priority,
}: {
  priority: { high: number; medium: number; low: number };
}) {
  const data = [
    { name: "High", value: priority.high, key: "high" as const },
    { name: "Medium", value: priority.medium, key: "medium" as const },
    { name: "Low", value: priority.low, key: "low" as const },
  ];
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <ChartCard
      title="Tasks by priority"
      icon={<AlertCircle className="h-4 w-4" />}
      empty={total === 0}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)" }}
            contentStyle={{
              backgroundColor: "var(--surface-elevated)",
              border: "1px solid var(--border)",
              borderRadius: "0.5rem",
              fontSize: "0.75rem",
            }}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.key} fill={PRIORITY_COLORS[entry.key]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function ProjectProgressCard({
  projects,
}: {
  projects: { id: string; name: string; total: number; done: number; progress: number }[];
}) {
  const top = projects.slice(0, 6);
  return (
    <ChartCard
      title="Project progress"
      icon={<BarChart3 className="h-4 w-4" />}
      empty={top.length === 0}
    >
      {top.length === 0 ? null : (
        <div className="h-full flex flex-col justify-center gap-3 overflow-y-auto pr-2">
          {top.map((p) => (
            <div key={p.id}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="font-medium text-foreground truncate pr-2">
                  {p.name}
                </span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {p.done}/{p.total} · {p.progress}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${p.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </ChartCard>
  );
}

function ActivityCard({
  days,
}: {
  days: { date: string; count: number; label: string }[];
}) {
  const total = days.reduce((s, d) => s + d.count, 0);
  return (
    <ChartCard
      title="Activity (last 14 days)"
      icon={<Activity className="h-4 w-4" />}
      empty={total === 0}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={days} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
            width={28}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--surface-elevated)",
              border: "1px solid var(--border)",
              borderRadius: "0.5rem",
              fontSize: "0.75rem",
            }}
          />
          <Line
            type="monotone"
            dataKey="count"
            stroke="var(--primary)"
            strokeWidth={2}
            dot={{ r: 2.5, fill: "var(--primary)" }}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
