import { authJsonHeaders, jsonHeaders, parseApiError } from "@/lib/api-client";

export type LoginPayload = {
  username: string;
  password: string;
};

export type RegisterPayload = {
  username: string;
  email: string;
  password: string;
};

export type VerifyOtpPayload = {
  email: string;
  code: string;
};

export type UpdateProfilePayload = {
  bio?: string;
  avatarUrl?: string;
  headline?: string;
  skills?: string[];
  githubUsername?: string;
  address?: {
    city?: string;
    country?: string;
  };
  socialLinks?: {
    linkedin?: string;
    github?: string;
    twitter?: string;
    website?: string;
  };
};

export type UserProfileResponse = {
  userId: number;
  username: string;
  email: string;
  avatarUrl?: string;
  headline?: string;
  bio?: string;
};

export type LoginResponse = {
  token: string;
  id: number;
  username: string;
  email: string;
};

const AUTH_BASE_URL = process.env.NEXT_PUBLIC_AUTH_API || "http://localhost:8080";
const USER_BASE_URL =
  process.env.NEXT_PUBLIC_USER_API || process.env.NEXT_PUBLIC_USER_URL || "http://localhost:5010";

export async function registerUser(payload: RegisterPayload): Promise<void> {
  const response = await fetch(`${AUTH_BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    return parseApiError(response, "Registration failed. Please try again.");
  }
}

export async function verifyRegistrationOtp(payload: VerifyOtpPayload): Promise<void> {
  const response = await fetch(`${AUTH_BASE_URL}/api/auth/verify`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    return parseApiError(response, "OTP verification failed. Please try again.");
  }
}

export async function resendRegistrationOtp(email: string): Promise<void> {
  const response = await fetch(`${AUTH_BASE_URL}/api/auth/resendOtp`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ email })
  });

  if (!response.ok) {
    return parseApiError(response, "Failed to resend OTP. Please try again.");
  }
}

export async function loginUser(payload: LoginPayload): Promise<LoginResponse> {
  const response = await fetch(`${AUTH_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    return parseApiError(response, "Login failed. Please try again.");
  }

  return (await response.json()) as LoginResponse;
}

export async function updateMyProfile(
  payload: UpdateProfilePayload,
  token: string
): Promise<void> {
  const response = await fetch(`${USER_BASE_URL}/api/profile/me`, {
    method: "PUT",
    headers: authJsonHeaders(token),
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    return parseApiError(response, "Failed to update profile. Please try again.");
  }
}

export async function getMyProfile(token: string): Promise<UserProfileResponse> {
  const response = await fetch(`${USER_BASE_URL}/api/profile/me`, {
    method: "GET",
    headers: authJsonHeaders(token)
  });

  if (!response.ok) {
    return parseApiError(response, "Failed to load profile.");
  }

  return (await response.json()) as UserProfileResponse;
}

export async function getProfileByUserId(
  token: string,
  userId: string | number
): Promise<UserProfileResponse> {
  const response = await fetch(`${USER_BASE_URL}/api/profile/${userId}`, {
    method: "GET",
    headers: authJsonHeaders(token)
  });

  if (!response.ok) {
    return parseApiError(response, "Failed to load user profile.");
  }

  return (await response.json()) as UserProfileResponse;
}

export async function searchProfilesByUsername(
  token: string,
  username: string
): Promise<UserProfileResponse[]> {
  const response = await fetch(`${USER_BASE_URL}/api/profile/search?username=${encodeURIComponent(username)}`, {
    method: "GET",
    headers: authJsonHeaders(token)
  });

  if (!response.ok) {
    return parseApiError(response, "Failed to search users.");
  }

  const data = (await response.json()) as unknown;

  if (Array.isArray(data)) {
    return data as UserProfileResponse[];
  }

  if (data && typeof data === "object" && "profiles" in data && Array.isArray((data as { profiles?: unknown }).profiles)) {
    return (data as { profiles: UserProfileResponse[] }).profiles;
  }

  if (data && typeof data === "object" && "userId" in data) {
    return [data as UserProfileResponse];
  }

  return [];
}
