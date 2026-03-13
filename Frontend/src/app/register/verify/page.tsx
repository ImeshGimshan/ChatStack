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
        <>
          Enter the OTP sent to <span className="text-zinc-100">{pending?.email ?? "your email"}</span>.
        </>
      }
      footer={
        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-zinc-300">
          <span>Wrong email?</span>
          <Button asChild variant="ghost" className="h-8 rounded-lg px-3 text-sm text-white hover:bg-white/10 hover:text-white">
            <Link href="/register">Edit details</Link>
          </Button>
        </div>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-2.5">
          <Label htmlFor="code" className="text-zinc-200">
            Verification code
          </Label>
          <Input
            id="code"
            type="text"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            required
            placeholder="Enter OTP code"
            className="h-11 rounded-xl border-white/20 bg-white/5 text-white placeholder:text-zinc-500 focus-visible:border-indigo-300/80 focus-visible:bg-white/10 focus-visible:ring-2 focus-visible:ring-indigo-400/30"
          />
        </div>

        {error ? (
          <Alert className="border-red-300/30 bg-red-500/10 text-red-100">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {notice ? (
          <Alert className="border-green-300/30 bg-green-500/10 text-green-100">
            <AlertDescription>{notice}</AlertDescription>
          </Alert>
        ) : null}

        <Button
          type="submit"
          disabled={!canSubmit}
          className={`${actionButtonClass} bg-linear-to-r from-indigo-500 via-indigo-600 to-blue-500 text-white hover:from-indigo-400 hover:via-indigo-500 hover:to-blue-400`}
        >
          {isSubmitting ? "Verifying..." : "Verify and continue"}
        </Button>

        <Button
          type="button"
          disabled={isResending || pending === null || cooldown > 0}
          variant="outline"
          onClick={onResendOtp}
          className={`${actionButtonClass} border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white`}
        >
          {isResending ? "Resending OTP..." : cooldown > 0 ? `Resend Code (${cooldown}s)` : "Resend Code"}
        </Button>
      </form>
    </AuthShell>
  );
}
