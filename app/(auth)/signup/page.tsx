"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "next-auth/react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Mail, Lock, User, UserPlus } from "lucide-react";

const schema = z.object({
  name: z.string().min(2, "At least 2 characters").max(60),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "At least 6 characters"),
});
type FormData = z.infer<typeof schema>;

export default function SignupPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setSubmitting(true);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast.error(body?.error ?? "Could not create account");
      setSubmitting(false);
      return;
    }
    const result = await signIn("credentials", { email: data.email, password: data.password, redirect: false });
    setSubmitting(false);
    if (result?.error) {
      toast.success("Account created — please sign in");
      router.push("/login");
      return;
    }
    toast.success("Welcome to SynergyIQ!");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
        <p className="mt-1 text-sm text-muted-foreground">Start collaborating with your team in minutes</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Full name" leftIcon={<User className="h-4 w-4" />} error={errors.name?.message} autoComplete="name" {...register("name")} />
        <Input label="Email" type="email" leftIcon={<Mail className="h-4 w-4" />} error={errors.email?.message} autoComplete="email" {...register("email")} />
        <Input label="Password" type="password" leftIcon={<Lock className="h-4 w-4" />} error={errors.password?.message} autoComplete="new-password" hint="At least 6 characters" {...register("password")} />
        <Button type="submit" size="lg" className="w-full" isLoading={submitting} leftIcon={<UserPlus className="h-4 w-4" />}>
          Create account
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
