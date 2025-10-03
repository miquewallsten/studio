
'use client';

import { useCallback } from 'react';
import { auth } from '@/lib/firebase';
import { getIdToken } from 'firebase/auth';

// A simple hook to make authenticated API requests
export function useSecureFetch() {
  const secureFetch = useCallback(async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Not authenticated.');
    }

    const token = await getIdToken(user);
    if (!token) {
        throw new Error('Not authenticated.');
    }

    const headers = new Headers(init.headers || {});
    headers.set('Accept', 'application/json');
    if (!headers.has('Content-Type') && init.body) {
      headers.set('Content-Type', 'application/json');
    }
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const res = await fetch(input, { ...init, headers });

    if (!res.ok) {
      let details = '';
      try {
        const json = await res.clone().json();
        details = json.error || JSON.stringify(json);
      } catch {
        try {
          details = await res.clone().text();
        } catch {}
      }
      const err = new Error(`HTTP ${res.status} ${res.statusText} – ${details}`);
      (err as any).status = res.status;
      throw err;
    }

    return res; // callers can safely do await res.json() exactly once
  }, []);

  return secureFetch;
}
