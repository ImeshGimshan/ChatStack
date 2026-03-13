import Link from "next/link";
import { ReactNode } from "react";

import { AuthStepProgress } from "@/components/auth/auth-step-progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type AuthShellProps = {
  title: string;
  description: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  stepLabel?: string;
  currentStep?: number;
  totalSteps?: number;
  maxWidthClassName?: string;
};

export function AuthShell({
  title,
  description,
  children,
  footer,
  stepLabel,
  currentStep,
  totalSteps = 3,
  maxWidthClassName = "max-w-md"
}: AuthShellProps) {
  return (
    <main className="relative min-h-svh overflow-hidden bg-[#0A0A0B] text-white">
      <div className={`relative z-10 mx-auto flex min-h-svh w-full ${maxWidthClassName} items-center px-4 py-10 sm:px-6`}>
        <Card className="w-full rounded-3xl border-white/20 bg-black/45 text-white shadow-[0_20px_60px_rgba(79,70,229,0.24),0_0_18px_rgba(255,255,255,0.08)] backdrop-blur-xl">
          <CardHeader className="space-y-2 p-6 pb-2 sm:p-8 sm:pb-2">
            <Link href="/" className="font-special text-lg text-white/90 hover:text-white">
              ChatStack
            </Link>
            {stepLabel ? (
              <div className="inline-flex w-fit rounded-full border border-indigo-300/40 bg-indigo-500/10 px-3 py-1 text-xs text-indigo-200">
                {stepLabel}
              </div>
            ) : null}
            {typeof currentStep === "number" ? (
              <AuthStepProgress currentStep={currentStep} totalSteps={totalSteps} />
            ) : null}
            <CardTitle className="font-special text-3xl tracking-tight">{title}</CardTitle>
            <CardDescription className="text-sm text-zinc-300">{description}</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 p-6 pt-2 sm:p-8 sm:pt-2">
            {children}

            {footer ? (
              <div className="space-y-3">
                <Separator className="bg-white/10" />
                {footer}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
