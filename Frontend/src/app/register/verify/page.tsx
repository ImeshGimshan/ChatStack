"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";
import { loginUser, resendRegistrationOtp, verifyRegistrationOtp } from "@/lib/auth-client";

const PENDING_REGISTRATION_KEY = "chatstack_pending_registration";

type PendingRegistration = {
  username: string;
  email: string;
  password: string;
};

export default function VerifyOtpPage() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [pending, setPending] = useState<PendingRegistration | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem(PENDING_REGISTRATION_KEY);
    if (!raw) {
      router.replace("/register");
      return;
    }

    try {
      setPending(JSON.parse(raw) as PendingRegistration);
    } catch {
      router.replace("/register");
    }
  }, [router]);

  const canSubmit = useMemo(() => {
    return code.trim().length >= 4 && pending !== null && !isSubmitting;
  }, [code, pending, isSubmitting]);

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setCooldown((value) => (value <= 1 ? 0 : value - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [cooldown]);

  const actionButtonClass =
    "h-11 w-full rounded-xl text-sm font-semibold transition-all duration-300";

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit || !pending) {
      return;
    }

    setError(null);
    setNotice(null);
    setIsSubmitting(true);

    try {
      await verifyRegistrationOtp({
        email: pending.email,
        code: code.trim()
      });

      const loginData = await loginUser({
        username: pending.username,
        password: pending.password
      });

      setSession(loginData.token, {
        id: loginData.id,
        username: loginData.username,
        email: loginData.email
      });



      sessionStorage.removeItem(PENDING_REGISTRATION_KEY);
      router.push("/register/profile");
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Verification failed.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onResendOtp() {
    if (!pending || isResending) {
      return;
    }

    setError(null);
    setNotice(null);
    setIsResending(true);

    try {
      await resendRegistrationOtp(pending.email);
      setNotice("A new OTP has been sent to your email.");
      setCooldown(60);
    } catch (resendError) {
      const message = resendError instanceof Error ? resendError.message : "Failed to resend OTP.";
      setError(message);
    } finally {
      setIsResending(false);
    }
  }

  return (
    <AuthShell
      title="Verify your email"
      description={
        <p className="text-muted-foreground">
          Enter the code sent to <span className="text-foreground font-medium">{pending?.email ?? "your email"}</span>
        </p>
      }
      footer={
        <p className="text-muted-foreground">
          Wrong email?{" "}
          <Link href="/register" className="text-primary hover:underline">
            Edit details
          </Link>
        </p>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="code" className="text-muted-foreground">
            Verification code
          </Label>
          <Input
            id="code"
            type="text"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            required
            placeholder="Enter 6-digit code"
            className="bg-surface border-border tracking-[0.2em] text-center text-lg font-bold"
            maxLength={6}
          />
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {notice ? (
          <Alert className="bg-primary/10 border-primary/20 text-primary">
            <AlertDescription>{notice}</AlertDescription>
          </Alert>
        ) : null}

        <Button type="submit" className="w-full" disabled={!canSubmit}>
          {isSubmitting ? "Verifying..." : "Verify Account"}
        </Button>

        <Button
          type="button"
          disabled={isResending || pending === null || cooldown > 0}
          variant="outline"
          onClick={onResendOtp}
          className="w-full"
        >
          {isResending ? "Resending..." : cooldown > 0 ? `Resend Code (${cooldown}s)` : "Resend Code"}
        </Button>
      </form>
    </AuthShell>
  );
}
