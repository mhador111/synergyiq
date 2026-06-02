import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { Logo } from "@/components/layout/Logo";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, FolderKanban, Users, BarChart3, Sparkles } from "lucide-react";

const features = [
  { icon: FolderKanban, title: "Projects that stay organized", body: "Track every deliverable with statuses, priorities, and clear ownership." },
  { icon: CheckCircle2, title: "Tasks with real context", body: "Assignments, due dates, comments, and file attachments — all in one thread." },
  { icon: Users, title: "Built for teams", body: "Workload summaries show who's busy and who's free to take the next thing." },
  { icon: BarChart3, title: "Insights at a glance", body: "A simple analytics view tells you what's on track and what needs attention." },
];

export default async function HomePage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="px-6 py-4 max-w-6xl mx-auto flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-2">
          <Link href="/login"><Button variant="ghost">Sign in</Button></Link>
          <Link href="/signup"><Button>Get started</Button></Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6">
        <section className="py-16 md:py-24 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6">
            <Sparkles className="h-3.5 w-3.5" /> Plan less, ship more
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
            Project & task collaboration <br className="hidden md:block" />
            <span className="text-primary">that actually flows.</span>
          </h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto">
            SynergyIQ helps small teams manage work, see progress, and stay aligned — without the bloat of enterprise tools.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link href="/signup"><Button size="lg">Start free</Button></Link>
            <Link href="/login"><Button size="lg" variant="outline">See a demo</Button></Link>
          </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-20">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl border border-border bg-surface-elevated p-6 hover:shadow-md transition-shadow">
              <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-foreground">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
