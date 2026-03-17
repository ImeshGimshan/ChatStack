export type AuthUser = {
  id: string;
  username: string;
  email: string;
};

const TOKEN_KEY = "chatstack_token";
const USER_KEY = "chatstack_user";

function isBrowserEnvironment() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function setAuthCookie(token: string) {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `chatstack_token=${encodeURIComponent(token)}; Path=/; Max-Age=604800; SameSite=Lax`;
}

function clearAuthCookie() {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = "chatstack_token=; Path=/; Max-Age=0; SameSite=Lax";
}

export function persistAuthSession(token: string, user: AuthUser) {
  if (!isBrowserEnvironment()) {
    return;
  }

  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  setAuthCookie(token);
}

export function clearPersistedAuthSession() {
  if (!isBrowserEnvironment()) {
    return;
  }

  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  clearAuthCookie();
}

export function readPersistedAuthSession(): { token: string | null; user: AuthUser | null } {
  if (!isBrowserEnvironment()) {
    return { token: null, user: null };
  }

  const token = localStorage.getItem(TOKEN_KEY);
  const userRaw = localStorage.getItem(USER_KEY);

  if (!token || !userRaw) {
    return { token: null, user: null };
  }

  try {
    const user = JSON.parse(userRaw) as AuthUser;
    return { token, user };
  } catch {
    clearPersistedAuthSession();
    return { token: null, user: null };
  }
}
