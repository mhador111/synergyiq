import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongoose";
import { Project } from "@/lib/models/project";
import { ProjectDetailView } from "@/components/projects/ProjectDetailView";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const meId = session?.user?.id ?? "";

  await connectDB();
  const project = await Project.findById(id)
    .populate("ownerId", "name email role avatarColor")
    .populate("memberIds", "name email role avatarColor")
    .lean();

  if (!project) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center">
        <h1 className="text-2xl font-semibold">Project not found</h1>
        <p className="text-sm text-muted-foreground mt-2">
          The project you&apos;re looking for doesn&apos;t exist or has been deleted.
        </p>
        <a href="/projects" className="text-primary text-sm mt-4 inline-block">
          ← Back to projects
        </a>
      </div>
    );
  }

  const isOwner = String(project.ownerId._id ?? project.ownerId) === meId;
  const isMember = (project.memberIds ?? []).some(
    (m: unknown) => String((m as { _id?: unknown })._id ?? m) === meId,
  );
  const hasAccess = isOwner || isMember || (session?.user?.role && session.user.role !== "member");

  if (!hasAccess) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center">
        <h1 className="text-2xl font-semibold">Access denied</h1>
        <p className="text-sm text-muted-foreground mt-2">
          You don&apos;t have access to this project.
        </p>
      </div>
    );
  }

  // Normalize Mongoose doc into serializable ProjectDetail
  const normalizeMember = (m: unknown) => {
    const obj = m as { _id?: unknown; id?: unknown; name?: string; email?: string; role?: string; avatarColor?: string };
    return {
      id: String(obj._id ?? obj.id ?? ""),
      name: obj.name ?? "",
      email: obj.email ?? "",
      role: (obj.role ?? "member") as "admin" | "manager" | "member",
      avatarColor: obj.avatarColor ?? "slate",
    };
  };

  const owner = project.ownerId && typeof project.ownerId === "object"
    ? normalizeMember(project.ownerId)
    : null;
  const members = (project.memberIds ?? [])
    .filter((m) => m && typeof m === "object")
    .map(normalizeMember);

  return (
    <ProjectDetailView
      projectId={id}
      initialProject={{
        id,
        name: project.name,
        description: project.description ?? "",
        status: project.status as "active" | "completed" | "on_hold",
        deadline: project.deadline ? new Date(project.deadline).toISOString() : null,
        ownerId: owner?.id ?? String(project.ownerId),
        memberIds: members.map((m) => m.id),
        owner,
        members,
        createdAt: new Date((project as { createdAt: Date }).createdAt).toISOString(),
        updatedAt: new Date((project as { updatedAt: Date }).updatedAt).toISOString(),
      }}
      currentUserId={meId}
      currentUserRole={(session?.user?.role as "admin" | "manager" | "member") ?? "member"}
    />
  );
}
