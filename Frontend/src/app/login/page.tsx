"use client";

import Link from "next/link";
import { Suspense } from "react";
import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";
import { loginUser } from "@/lib/auth-client";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.9-5.5 3.9-3.3 0-6.1-2.8-6.1-6.2s2.8-6.2 6.1-6.2c1.9 0 3.1.8 3.8 1.4l2.6-2.5C16.8 3 14.6 2 12 2 6.5 2 2 6.5 2 12s4.5 10 10 10c5.8 0 9.6-4.1 9.6-9.8 0-.7-.1-1.3-.2-2H12z"
      />
      <path
        fill="#34A853"
        d="M3.2 7.3l3.2 2.3C7.3 7.7 9.5 6 12 6c1.9 0 3.1.8 3.8 1.4l2.6-2.5C16.8 3 14.6 2 12 2 8.2 2 4.9 4.1 3.2 7.3z"
      />
      <path
        fill="#4A90E2"
        d="M12 22c2.5 0 4.6-.8 6.2-2.3l-2.9-2.3c-.8.6-1.9 1-3.3 1-2.5 0-4.7-1.7-5.5-4l-3.3 2.6C4.9 19.9 8.2 22 12 22z"
      />
      <path
        fill="#FBBC05"
        d="M3.2 16.9l3.3-2.6c-.2-.7-.3-1.4-.3-2.1s.1-1.4.3-2.1L3.2 7.4C2.4 8.9 2 10.4 2 12s.4 3.1 1.2 4.9z"
      />
    </svg>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSession } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = useMemo(() => {
    return username.trim().length > 0 && password.length > 0 && !isSubmitting;
  }, [username, password, isSubmitting]);

  const actionButtonClass =
    "h-11 w-full rounded-xl text-sm font-semibold transition-all duration-300";

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const data = await loginUser({
        username: username.trim(),
        password
      });

      setSession(data.token, {
        id: data.id,
        username: data.username,
        email: data.email
      });

      const requestedRedirect = searchParams.get("redirect");
      const redirectPath =
        requestedRedirect && requestedRedirect.startsWith("/") && requestedRedirect !== "/"
          ? requestedRedirect
          : "/chat";

      router.replace(redirectPath);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Login failed.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      description="Sign in with your username and password."
      footer={
        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-zinc-300">
          <span>No account yet?</span>
          <Button
            asChild
            variant="ghost"
            className="h-8 rounded-lg px-3 text-sm text-white hover:bg-white/10 hover:text-white"
          >
            <Link href="/register">Sign up</Link>
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
            placeholder="Enter your username"
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
            autoComplete="current-password"
            required
            placeholder="Enter your password"
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
          {isSubmitting ? "Signing in..." : "Login"}
        </Button>

        <Button
          type="button"
          className={`${actionButtonClass} border border-white/20 bg-white/5 text-white hover:bg-white/10`}
        >
          <GoogleIcon />
          <span className="ml-2">Continue with Google</span>
        </Button>
      </form>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}
