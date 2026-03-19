'use client';

import { useAuth } from '@clerk/nextjs';
import { useCallback } from 'react';
import { apiFetch, apiFetchBlob } from '@/lib/apiClient';

/**
 * Hook that returns auth-aware versions of apiFetch and apiFetchBlob.
 * Automatically attaches the Clerk Bearer token to requests.
 */
export function useAuthFetch() {
  const { getToken } = useAuth();

  const authFetch = useCallback(
    async <T = unknown>(path: string, options: RequestInit = {}): Promise<T> => {
      const token = await getToken();
      return apiFetch<T>(path, { ...options, token: token ?? undefined });
    },
    [getToken],
  );

  const authFetchBlob = useCallback(
    async (path: string, options: RequestInit = {}): Promise<Blob> => {
      const token = await getToken();
      return apiFetchBlob(path, { ...options, token: token ?? undefined });
    },
    [getToken],
  );

  return { authFetch, authFetchBlob, getToken };
}
