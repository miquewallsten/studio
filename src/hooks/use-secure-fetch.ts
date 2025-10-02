
'use client';

import { useCallback } from 'react';
import { auth } from '@/lib/firebase';
import { getIdToken } from 'firebase/auth';

// A simple hook to make authenticated API requests
export function useSecureFetch() {
  const secureFetch = useCallback(async (url: string, options: RequestInit = {}, expectJson = true) => {
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
    if (expectJson && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'An unknown server error occurred.'}));
        throw new Error(errorData.error || 'An unknown server error occurred.');
    }

    if (expectJson) {
      // Handle cases where the response might be empty
      const text = await response.text();
      return text ? JSON.parse(text) : {};
    }
    
    return response;
  }, []);

  return secureFetch;
}
