"use client";

import { Suspense, useEffect, useState, type MouseEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Mail, Lock, LogIn } from "lucide-react";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "At least 6 characters"),
});
type FormData = z.infer<typeof schema>;

const demoAccounts = [
  { label: "Admin", email: "admin@demo.com", password: "admin123" },
  { label: "Manager", email: "manager@demo.com", password: "manager123" },
  { label: "Member", email: "member@demo.com", password: "member123" },
];

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justSignedUp = searchParams.get("signup") === "success";
  const prefillEmail = searchParams.get("email") ?? "";
  const [submitting, setSubmitting] = useState(false);
  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: prefillEmail, password: "" },
  });

  useEffect(() => {
    if (justSignedUp) {
      toast.success("Account created — sign in to continue");
      if (prefillEmail) reset({ email: prefillEmail, password: "" });
    }
  }, [justSignedUp, prefillEmail, reset]);

  async function onSubmit(data: FormData) {
    setSubmitting(true);
    const res = await signIn("credentials", { email: data.email, password: data.password, redirect: false });
    setSubmitting(false);
    if (res?.error) {
      toast.error("Invalid email or password");
      return;
    }
    toast.success("Welcome back!");
    router.push("/dashboard");
    router.refresh();
  }

  function fillDemo(event: MouseEvent<HTMLButtonElement>, d: { email: string; password: string }) {
    event.preventDefault();
    event.stopPropagation();
    reset({ email: d.email, password: d.password }, { keepErrors: false });
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="mt-1 text-sm text-muted-foreground">Sign in to your account to continue</p>
      </div>

      <form method="post" noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Controller
          name="email"
          control={control}
          render={({ field }) => (
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              leftIcon={<Mail className="h-4 w-4" />}
              error={errors.email?.message}
              {...field}
            />
          )}
        />
        <Controller
          name="password"
          control={control}
          render={({ field }) => (
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              leftIcon={<Lock className="h-4 w-4" />}
              error={errors.password?.message}
              {...field}
            />
          )}
        />
        <Button type="submit" size="lg" className="w-full" isLoading={submitting} leftIcon={<LogIn className="h-4 w-4" />}>
          Sign in
        </Button>
      </form>

      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">Or try a demo account</span>
          <div className="flex-1 h-px bg-border" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {demoAccounts.map((d) => (
            <Button key={d.email} type="button" variant="outline" size="sm" onClick={(event) => fillDemo(event, d)}>
              {d.label}
            </Button>
          ))}
        </div>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Don't have an account?{" "}
        <Link href="/signup" className="font-medium text-primary hover:underline">Create one</Link>
      </p>
    </div>
  );
}
