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

    const response = await fetch(url, {
      ...options,
      headers,
    });
    
    // Check if the response is JSON before trying to parse it
    const contentType = response.headers.get('content-type');
    if (!response.ok) {
        let errorData = { error: `Request failed with status ${response.status}` };
        if (contentType && contentType.includes('application/json')) {
            try {
                errorData = await response.json();
            } catch(e) {
                // The server returned an error but not valid JSON
                const text = await response.text();
                errorData.error = text || errorData.error;
            }
        }
        throw new Error(errorData.error || 'An unknown server error occurred.');
    }

    if (contentType && contentType.includes('application/json')) {
      const text = await response.text();
      // Handle cases where the response is empty but has a JSON content type
      return text ? JSON.parse(text) : {};
    }
    
    // Handle non-json responses, e.g. from a proxy
    return response;
  }, []);

  return secureFetch;
}