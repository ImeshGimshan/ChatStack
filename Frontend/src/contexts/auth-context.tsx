"use client";

import { createContext, ReactNode, useContext, useState } from "react";

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
  const [initialSession] = useState(() => readPersistedAuthSession());
  const [status, setStatus] = useState<AuthStatus>(
    initialSession.token && initialSession.user ? "authenticated" : "unauthenticated"
  );
  const [token, setToken] = useState<string | null>(initialSession.token);
  const [user, setUser] = useState<AuthUser | null>(initialSession.user);

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

  const value: AuthContextValue = {
    status,
    token,
    user,
    setSession,
    updateUser,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
