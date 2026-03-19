'use client';

/**
 * Safe fetch wrapper with automatic toast notifications on errors.
 *
 * Delegates to the central apiClient (apiFetch) for actual HTTP calls,
 * then adds toast-based error reporting on top.
 */

import { toast } from '@/components/ui/use-toast';
import { apiFetch, ApiError } from '@/lib/apiClient';

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
  token?: string;
}

export async function safeFetch<T = unknown>(
  url: string,
  options: SafeFetchOptions = {}
): Promise<T> {
  const { showToast = true, errorMessage, skipCsrf: _skipCsrf, ...rest } = options;

  try {
    return await apiFetch<T>(url, rest);
  } catch (error) {
    let message: string;
    let status = 0;
    let code: string | undefined;

    if (error instanceof ApiError) {
      message = errorMessage ?? error.message;
      status = error.status;
      code = error.code;
    } else if (error instanceof TypeError && error.message === 'Failed to fetch') {
      message = errorMessage ?? 'Network error. Please check your connection.';
      code = 'NETWORK_ERROR';
    } else {
      message =
        errorMessage ??
        (error instanceof Error ? error.message : 'An unexpected error occurred');
      code = 'UNKNOWN_ERROR';
    }

    const appError = new AppError(message, status, code, error);

    if (showToast) {
      const title = code === 'NETWORK_ERROR' ? 'Connection Error' : 'Error';
      toast({
        variant: 'destructive',
        title,
        description: message,
      });
    }

    throw appError;
  }
}
