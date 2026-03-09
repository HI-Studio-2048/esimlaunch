'use client';

/**
 * Safe fetch wrapper that automatically handles errors and shows toast notifications.
 * Uses NEXT_PUBLIC_API_BASE_URL for relative paths. Supports full URLs for external calls.
 */

import { toast } from '@/components/ui/use-toast';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001/api';
const CSRF_TOKEN_HEADER = 'x-csrf-token';

export class AppError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public cause?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

interface SafeFetchOptions extends RequestInit {
  showToast?: boolean;
  errorMessage?: string;
  skipCsrf?: boolean;
  userEmail?: string;
}

let csrfTokenCache: string | null = null;

function getCsrfToken(): string {
  if (csrfTokenCache) return csrfTokenCache;
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  csrfTokenCache = Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return csrfTokenCache;
}

function resolveUrl(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${API_BASE.replace(/\/$/, '')}${path}`;
}

export async function safeFetch<T = unknown>(
  url: string,
  options: SafeFetchOptions = {}
): Promise<T> {
  const { showToast = true, errorMessage, skipCsrf = false, userEmail, ...fetchOptions } = options;
  const fullUrl = resolveUrl(url);

  const method = (fetchOptions.method ?? 'GET').toUpperCase();
  const isStateChanging = ['POST', 'PATCH', 'PUT', 'DELETE'].includes(method);
  const isInternalApi =
    fullUrl.includes(API_BASE) && !fullUrl.includes('/api/webhooks/');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string> | undefined),
  };

  if (!skipCsrf && isStateChanging && isInternalApi) {
    headers[CSRF_TOKEN_HEADER] = getCsrfToken();
  }
  if (userEmail) {
    headers['x-user-email'] = userEmail;
  }

  try {
    const response = await fetch(fullUrl, { ...fetchOptions, headers });

    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    let data: unknown;
    if (isJson) {
      data = await response.json();
    } else {
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text || response.statusText || 'An error occurred' };
      }
    }

    if (!response.ok) {
      const dataObj = data as Record<string, unknown>;
      const message =
        (errorMessage as string) ||
        (dataObj?.message as string) ||
        (dataObj?.error as string) ||
        `Request failed: ${response.statusText}`;
      const errorCode =
        (dataObj?.errorCode as string) ||
        (dataObj?.code as string) ||
        `ERR_${response.status}`;

      const appError = new AppError(message, response.status, errorCode, data);

      if (showToast) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: message,
        });
      }

      throw appError;
    }

    return data as T;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      const message =
        (errorMessage as string) || 'Network error. Please check your connection.';
      const appError = new AppError(message, 0, 'NETWORK_ERROR', error);

      if (showToast) {
        toast({
          variant: 'destructive',
          title: 'Connection Error',
          description: message,
        });
      }

      throw appError;
    }

    const message =
      (errorMessage as string) ||
      (error instanceof Error ? error.message : 'An unexpected error occurred');
    const appError = new AppError(message, 0, 'UNKNOWN_ERROR', error);

    if (showToast) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: message,
      });
    }

    throw appError;
  }
}
