'use client';

/**
 * Central API client for the esimlaunch-template web app.
 *
 * - Reads NEXT_PUBLIC_API_BASE_URL from env.
 * - Attaches x-csrf-token on state-changing requests (POST/PUT/PATCH/DELETE).
 * - Attaches x-user-email when the caller supplies it.
 * - Throws ApiError on non-2xx responses.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001/api';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Generate and cache a CSRF token per browser session
let csrfToken: string | null = null;

function getCsrfToken(): string {
  if (csrfToken) return csrfToken;
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  csrfToken = Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return csrfToken;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit & { userEmail?: string } = {},
): Promise<T> {
  const { userEmail, ...fetchOptions } = options;
  const method = (fetchOptions.method ?? 'GET').toUpperCase();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string> | undefined),
  };

  // Attach CSRF for state-changing methods
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    headers['x-csrf-token'] = getCsrfToken();
  }

  // Attach user email for authenticated requests
  if (userEmail) {
    headers['x-user-email'] = userEmail;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...fetchOptions,
    headers,
  });

  if (!res.ok) {
    let errorMessage = `Request failed: ${res.status}`;
    let errorCode: string | undefined;
    try {
      const data = await res.json();
      errorMessage = data.message ?? errorMessage;
      errorCode = data.errorCode;
    } catch {}
    throw new ApiError(res.status, errorMessage, errorCode);
  }

  return res.json() as Promise<T>;
}
