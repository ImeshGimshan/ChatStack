"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerUser } from "@/lib/auth-client";

const PENDING_REGISTRATION_KEY = "chatstack_pending_registration";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = useMemo(() => {
    return (
      username.trim().length >= 3 &&
      email.trim().length > 0 &&
      password.length >= 8 &&
      confirmPassword.length >= 8 &&
      !isSubmitting
    );
  }, [username, email, password, confirmPassword, isSubmitting]);

  const actionButtonClass =
    "h-11 w-full rounded-xl text-sm font-semibold transition-all duration-300";

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await registerUser({
        username: username.trim(),
        email: email.trim(),
        password
      });

      sessionStorage.setItem(
        PENDING_REGISTRATION_KEY,
        JSON.stringify({
          username: username.trim(),
          email: email.trim(),
          password
        })
      );

      router.push("/register/verify");
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Registration failed.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Create your account"
      description="Start with your basic account details."
      footer={
        <p className="text-zinc-400">
          Already have an account?{" "}
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300 transition-colors drop-shadow-electric-glow hover:underline">
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-3">
          <Label htmlFor="username" className="font-montserrat text-zinc-300 text-sm font-medium tracking-wide">
            Username
          </Label>
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="choose_a_username"
            className="bg-black/50 border-white/10 text-white rounded-xl focus-visible:ring-indigo-500 focus-visible:border-indigo-500/50 placeholder:text-zinc-600"
            required
          />
        </div>
        <div className="space-y-3">
          <Label htmlFor="email" className="font-montserrat text-zinc-300 text-sm font-medium tracking-wide">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="bg-black/50 border-white/10 text-white rounded-xl focus-visible:ring-indigo-500 focus-visible:border-indigo-500/50 placeholder:text-zinc-600"
            required
          />
        </div>
        <div className="space-y-3">
          <Label htmlFor="password" className="font-montserrat text-zinc-300 text-sm font-medium tracking-wide">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="bg-black/50 border-white/10 text-white rounded-xl focus-visible:ring-indigo-500 focus-visible:border-indigo-500/50 placeholder:text-zinc-600"
            required
          />
        </div>
        <div className="space-y-3">
          <Label htmlFor="confirmPassword" className="font-montserrat text-zinc-300 text-sm font-medium tracking-wide">
            Confirm password
          </Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            className="bg-black/50 border-white/10 text-white rounded-xl focus-visible:ring-indigo-500 focus-visible:border-indigo-500/50 placeholder:text-zinc-600"
            required
          />
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <Button type="submit" className="w-full h-11 rounded-xl border border-indigo-300/35 bg-linear-to-r from-indigo-500 via-indigo-600 to-blue-500 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] transition-all duration-300 hover:from-indigo-400 hover:via-indigo-500 hover:to-blue-400 hover:shadow-[0_0_16px_rgba(99,102,241,0.5)] disabled:opacity-50 disabled:pointer-events-none" disabled={!canSubmit}>
          {isSubmitting ? "Creating account..." : "Create Account"}
        </Button>
      </form>
    </AuthShell>
  );
}
