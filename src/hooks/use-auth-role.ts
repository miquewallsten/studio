
'use client';

import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import type { User } from 'firebase/auth';

export function useAuthRole() {
  const [user, loading] = useAuthState(auth);
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (loading) {
      setIsLoading(true);
      return;
    }

    if (user) {
      user.getIdTokenResult(true) // Force refresh the token
        .then((idTokenResult) => {
          const userRole = (idTokenResult.claims.role as string) || 'Unassigned';
          setRole(userRole);
          setIsLoading(false);
        })
        .catch(() => {
          setRole(null);
          setIsLoading(false);
        });
    } else {
      setRole(null);
      setIsLoading(false);
    }
  }, [user, loading]);

  return { role, isLoading };
}
