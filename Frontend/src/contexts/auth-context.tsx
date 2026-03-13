"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

import {
  AuthUser,
  clearPersistedAuthSession,
  persistAuthSession,
  readPersistedAuthSession
} from "@/lib/auth-session";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  status: AuthStatus;
  token: string | null;
  user: AuthUser | null;
  setSession: (token: string, user: AuthUser) => void;
  updateUser: (user: AuthUser) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const session = readPersistedAuthSession();

    if (session.token && session.user) {
      setToken(session.token);
      setUser(session.user);
      setStatus("authenticated");
      return;
    }

    setStatus("unauthenticated");
  }, []);

  function setSession(nextToken: string, nextUser: AuthUser) {
    persistAuthSession(nextToken, nextUser);
    setToken(nextToken);
    setUser(nextUser);
    setStatus("authenticated");
  }

  function updateUser(nextUser: AuthUser) {
    if (!token) {
      return;
    }

    persistAuthSession(token, nextUser);
    setUser(nextUser);
  }

  function logout() {
    clearPersistedAuthSession();
    setToken(null);
    setUser(null);
    setStatus("unauthenticated");
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      token,
      user,
      setSession,
      updateUser,
      logout
    }),
    [status, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
