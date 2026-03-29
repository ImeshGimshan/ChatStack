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
  maxWidthClassName = "max-w-sm"
}: AuthShellProps) {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-2 md:p-4 font-sans">
      <div
        className={`w-full ${maxWidthClassName} space-y-4 md:space-y-6 animate-float-up bg-[#0A0A0B]/80 backdrop-blur-xl border border-white/10 p-3 md:p-5 sm:p-8 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]`}
      >
        <div className="text-center space-y-2">
          <Link 
            href="/" 
            className="font-special rounded-full px-3 py-2 text-2xl font-semibold tracking-tight text-white mb-2 inline-block [text-shadow:0_0_10px_rgba(99,102,241,0.55)]"
          >
            ChatStack
          </Link>
          <h1 className="text-2xl font-special tracking-tight text-white">{title}</h1>
          <div className="text-zinc-400 text-sm">{description}</div>
        </div>

        <div className="space-y-4">
          {children}
        </div>

        {footer ? (
          <div className="text-center space-y-2 text-sm">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
