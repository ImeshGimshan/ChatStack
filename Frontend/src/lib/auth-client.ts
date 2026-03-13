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

type ErrorBody = {
  Error?: string;
  error?: string;
  message?: string;
};

const AUTH_BASE_URL = process.env.NEXT_PUBLIC_AUTH_API || "http://localhost:8080";
const USER_BASE_URL = process.env.NEXT_PUBLIC_USER_URL || "http://localhost:5010";

async function parseError(response: Response, fallbackMessage: string): Promise<never> {
  let message = fallbackMessage;

  try {
    const body = (await response.json()) as ErrorBody;
    message = body.Error || body.error || body.message || message;
  } catch {
    // Keep fallback when response is not JSON.
  }

  throw new Error(message);
}

export async function registerUser(payload: RegisterPayload): Promise<void> {
  const response = await fetch(`${AUTH_BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    return parseError(response, "Registration failed. Please try again.");
  }
}

export async function verifyRegistrationOtp(payload: VerifyOtpPayload): Promise<void> {
  const response = await fetch(`${AUTH_BASE_URL}/api/auth/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    return parseError(response, "OTP verification failed. Please try again.");
  }
}

export async function resendRegistrationOtp(email: string): Promise<void> {
  const response = await fetch(`${AUTH_BASE_URL}/api/auth/resendOtp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email })
  });

  if (!response.ok) {
    return parseError(response, "Failed to resend OTP. Please try again.");
  }
}

export async function loginUser(payload: LoginPayload): Promise<LoginResponse> {
  const response = await fetch(`${AUTH_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    return parseError(response, "Login failed. Please try again.");
  }

  return (await response.json()) as LoginResponse;
}

export async function updateMyProfile(
  payload: UpdateProfilePayload,
  token: string
): Promise<void> {
  const response = await fetch(`${USER_BASE_URL}/api/profile/me`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    return parseError(response, "Failed to update profile. Please try again.");
  }
}

export async function getMyProfile(token: string): Promise<UserProfileResponse> {
  const response = await fetch(`${USER_BASE_URL}/api/profile/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    return parseError(response, "Failed to load profile.");
  }

  return (await response.json()) as UserProfileResponse;
}

export async function getProfileByUserId(
  token: string,
  userId: string | number
): Promise<UserProfileResponse> {
  const response = await fetch(`${USER_BASE_URL}/api/profile/${userId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    return parseError(response, "Failed to load user profile.");
  }

  return (await response.json()) as UserProfileResponse;
}
