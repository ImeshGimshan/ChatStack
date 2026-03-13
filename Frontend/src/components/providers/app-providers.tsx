"use client";

import { ReactNode } from "react";

import { AuthProvider } from "@/contexts/auth-context";

export function AppProviders({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
