'use client';

import { useCallback } from 'react';
import { auth } from '@/lib/firebase';
import { getIdToken } from 'firebase/auth';

// A simple hook to make authenticated API requests
export function useSecureFetch() {
  const secureFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Not authenticated.');
    }

    const token = await getIdToken(user);
    if (!token) {
        throw new Error('Not authenticated.');
    }

    const headers = new Headers(options.headers);
    headers.set('Authorization', `Bearer ${token}`);
    if (options.body && typeof options.body === 'string' && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const res = await fetch(url, {
      ...options,
      headers,
    });
    
    if (!res.ok) {
        let details = '';
        try { details = await res.clone().text(); } catch {}
        const err = new Error(`HTTP ${res.status} ${res.statusText} – ${details}`);
        (err as any).status = res.status;
        throw err;
      }
    
      return res; // callers can still do await res.json() once
  }, []);

  return secureFetch;
}
