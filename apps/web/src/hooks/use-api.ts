"use client";

import { useMemo } from 'react';
import { apiFetch } from '@/lib/api/client';

export function useApi() {
  const api = useMemo(() => ({
    get: (url: string, options?: any) => apiFetch(url, { ...options, method: 'GET' }),
    post: (url: string, body: any, options?: any) => apiFetch(url, {
      ...options,
      method: 'POST',
      body: typeof body === 'string' ? body : JSON.stringify(body)
    }),
    patch: (url: string, body: any, options?: any) => apiFetch(url, {
      ...options,
      method: 'PATCH',
      body: typeof body === 'string' ? body : JSON.stringify(body)
    }),
    put: (url: string, body: any, options?: any) => apiFetch(url, {
      ...options,
      method: 'PUT',
      body: typeof body === 'string' ? body : JSON.stringify(body)
    }),
    delete: (url: string, options?: any) => apiFetch(url, { ...options, method: 'DELETE' }),
  }), []);

  return api;
}
