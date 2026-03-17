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
      title="Sign in to your account"
      description="Enter your credentials to access your chat servers."
      footer={
        <p className="text-muted-foreground">
          Don't have an account?{" "}
          <Link href="/register" className="text-primary hover:underline">
            Sign up
          </Link>
        </p>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username" className="text-muted-foreground">
            Username
          </Label>
          <Input
            id="username"
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            required
            placeholder="your_username"
            className="bg-surface border-border"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-muted-foreground">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
            placeholder="••••••••"
            className="bg-surface border-border"
          />
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <Button type="submit" className="w-full" disabled={!canSubmit}>
          {isSubmitting ? "Signing in..." : "Sign In"}
        </Button>

        <div className="text-center pt-2">
          <Link href="/forgot-password" disable-link-formatting="true" className="text-primary hover:underline text-sm">
            Forgot password?
          </Link>
        </div>
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
