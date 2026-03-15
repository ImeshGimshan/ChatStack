type ErrorBody = {
  Error?: string;
  error?: string;
  message?: string;
};

export async function parseApiError(response: Response, fallbackMessage: string): Promise<never> {
  let message = fallbackMessage;

  try {
    const body = (await response.json()) as ErrorBody;
    message = body.Error || body.error || body.message || message;
  } catch {
    // Keep fallback when response body is not JSON.
  }

  throw new Error(message);
}

export function jsonHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json"
  };
}

export function authJsonHeaders(token: string): HeadersInit {
  return {
    ...jsonHeaders(),
    Authorization: `Bearer ${token}`
  };
}
