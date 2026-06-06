import Link from "next/link";
import { Compass, Home } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/layout/Logo";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-background text-foreground">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="flex items-center justify-center mb-2">
          <Logo />
        </div>
        <div className="mx-auto h-12 w-12 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
          <Compass className="h-6 w-6" />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">404 — Page not found</h1>
        <p className="text-sm text-muted-foreground">
          The page you're looking for doesn't exist, or it may have been moved.
        </p>
        <div className="flex items-center justify-center gap-2 pt-2">
          <Link href="/">
            <Button leftIcon={<Home className="h-4 w-4" />}>Back home</Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline">Go to dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
