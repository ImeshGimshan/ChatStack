export interface User {
  id: number;
  username: string;
  email: string;
}

export interface Message {
  sender: string;
  text: string;
  timestamp: string;
}

export interface Post {
  id: number;
  title?: string;
  content: string;
  imageUrl?: string;
  authorId: number | string;  // backend BigInt is serialised as string
  serverId?: number | string;
  createdAt: string;
  updatedAt: string;
  author?: { username: string; id: number };
}

export interface Profile {
  userId: number;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  id: number;
  username: string;
  email: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface RegisterResponse {
  id: number;
  username: string;
  email: string;
  enabled: boolean;
  verficationCode: string;
  verficationCodeExpiresAt: string;
}

export interface VerifyEmailRequest {
  email: string;
  code: string;
}

export interface VerifyEmailResponse {
  message: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  pendingRegistration: { email: string; username: string } | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  getToken: () => string | null;
  register: (credentials: RegisterCredentials) => Promise<void>;
  verifyEmail: (email: string, verificationCode: string) => Promise<string>;
}