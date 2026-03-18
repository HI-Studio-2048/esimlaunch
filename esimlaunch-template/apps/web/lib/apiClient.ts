'use client';

/**
 * Central API client for the esimlaunch-template web app.
 *
 * - Reads NEXT_PUBLIC_API_BASE_URL from env.
 * - Attaches x-csrf-token on state-changing requests (POST/PUT/PATCH/DELETE).
 * - Attaches Authorization: Bearer <token> when the caller supplies a token.
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

// NOTE: CSRF token is no longer validated by the backend (guard is a no-op).
// Protection is provided by SameSite cookies + CORS + Clerk JWT auth.
// This code is kept for backward compatibility but has no security effect.

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
  options: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, ...fetchOptions } = options;
  const method = (fetchOptions.method ?? 'GET').toUpperCase();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string> | undefined),
  };

  // Attach CSRF for state-changing methods
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    headers['x-csrf-token'] = getCsrfToken();
  }

  // Attach Bearer token for authenticated requests
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
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

/** Fetch binary (e.g. PDF) with auth. Returns blob. */
export async function apiFetchBlob(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<Blob> {
  const { token, ...fetchOptions } = options;
  const headers: Record<string, string> = {
    ...(fetchOptions.headers as Record<string, string> | undefined),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001/api';
  const res = await fetch(`${API_BASE}${path}`, { ...fetchOptions, headers });
  if (!res.ok) throw new ApiError(res.status, `Request failed: ${res.status}`);
  return res.blob();
}
