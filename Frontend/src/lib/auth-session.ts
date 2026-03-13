export type AuthUser = {
  id: number;
  username: string;
  email: string;
};

const TOKEN_KEY = "chatstack_token";
const USER_KEY = "chatstack_user";

function setAuthCookie(token: string) {
  document.cookie = `chatstack_token=${encodeURIComponent(token)}; Path=/; Max-Age=604800; SameSite=Lax`;
}

function clearAuthCookie() {
  document.cookie = "chatstack_token=; Path=/; Max-Age=0; SameSite=Lax";
}

export function persistAuthSession(token: string, user: AuthUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  setAuthCookie(token);
}

export function clearPersistedAuthSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  clearAuthCookie();
}

export function readPersistedAuthSession(): { token: string | null; user: AuthUser | null } {
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
