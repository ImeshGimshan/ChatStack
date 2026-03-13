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
        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-zinc-300">
          <span>Already have an account?</span>
          <Button asChild variant="ghost" className="h-8 rounded-lg px-3 text-sm text-white hover:bg-white/10 hover:text-white">
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-2.5">
          <Label htmlFor="username" className="text-zinc-200">
            Username
          </Label>
          <Input
            id="username"
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            required
            placeholder="Choose a username"
            className="h-11 rounded-xl border-white/20 bg-white/5 text-white placeholder:text-zinc-500 focus-visible:border-indigo-300/80 focus-visible:bg-white/10 focus-visible:ring-2 focus-visible:ring-indigo-400/30"
          />
        </div>

        <div className="space-y-2.5">
          <Label htmlFor="email" className="text-zinc-200">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
            placeholder="Enter your email"
            className="h-11 rounded-xl border-white/20 bg-white/5 text-white placeholder:text-zinc-500 focus-visible:border-indigo-300/80 focus-visible:bg-white/10 focus-visible:ring-2 focus-visible:ring-indigo-400/30"
          />
        </div>

        <div className="space-y-2.5">
          <Label htmlFor="password" className="text-zinc-200">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            required
            placeholder="Create a password (min 8 chars)"
            className="h-11 rounded-xl border-white/20 bg-white/5 text-white placeholder:text-zinc-500 focus-visible:border-indigo-300/80 focus-visible:bg-white/10 focus-visible:ring-2 focus-visible:ring-indigo-400/30"
          />
        </div>

        <div className="space-y-2.5">
          <Label htmlFor="confirmPassword" className="text-zinc-200">
            Confirm password
          </Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            required
            placeholder="Confirm your password"
            className="h-11 rounded-xl border-white/20 bg-white/5 text-white placeholder:text-zinc-500 focus-visible:border-indigo-300/80 focus-visible:bg-white/10 focus-visible:ring-2 focus-visible:ring-indigo-400/30"
          />
        </div>

        {error ? (
          <Alert className="border-red-300/30 bg-red-500/10 text-red-100">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <Button
          type="submit"
          disabled={!canSubmit}
          className={`${actionButtonClass} bg-linear-to-r from-indigo-500 via-indigo-600 to-blue-500 text-white hover:from-indigo-400 hover:via-indigo-500 hover:to-blue-400`}
        >
          {isSubmitting ? "Creating account..." : "Continue to verification"}
        </Button>
      </form>
    </AuthShell>
  );
}
