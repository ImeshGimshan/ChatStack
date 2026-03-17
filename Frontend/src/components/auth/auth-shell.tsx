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
    <div className="flex min-h-svh items-center justify-center bg-background p-4 font-sans">
      <div
        className={`w-full ${maxWidthClassName} space-y-6 animate-float-up`}
      >
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 text-xl font-bold text-foreground">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6 text-primary"
            >
              <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
            </svg>
            ChatStack
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
          <div className="text-muted-foreground text-sm">{description}</div>
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
