'use client';

import { useCallback } from 'react';

// A simple hook to make authenticated API requests
export function useSecureFetch() {
  const secureFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    // A bit of a hack to read the cookie on the client
    const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('firebaseIdToken='))
        ?.split('=')[1];

    if (!token) {
      throw new Error('Not authenticated.');
    }

    const headers = new Headers(options.headers);
    headers.set('Authorization', `Bearer ${token}`);

    const response = await fetch(url, {
      ...options,
      headers,
    });

    return response.json();
  }, []);

  return secureFetch;
}
