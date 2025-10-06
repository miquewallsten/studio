
'use client';

import type { ReactNode } from 'react';
import { UserNav } from '@/components/client-user-nav';
import Link from 'next/link';
import { Icons } from '@/components/icons';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, User, getIdToken } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { SupportChatWidget } from '@/components/support-chat-widget';

export default function ClientLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const idTokenResult = await user.getIdTokenResult();
        const userRole = idTokenResult.claims.role;
        // Allow Tenant Admins, Tenant Users, and End Users. Deny internal staff.
        if (userRole && ['Tenant Admin', 'Tenant User', 'End User'].includes(userRole as unknown as string)) {
          setUser(user);
          // Set cookie for server-side rendering
          const idToken = await user.getIdToken();
          document.cookie = `firebaseIdToken=${idToken}; path=/;`;
        } else {
          // If it's an internal user, send them to the main dashboard
          router.push('/dashboard');
        }
      } else {
        router.push('/client/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
       <div className="flex min-h-screen w-full flex-col">
            <header className="flex h-16 items-center justify-between border-b px-6">
                <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-32" />
                </div>
                <div className="flex items-center gap-4">
                    <Skeleton className="h-9 w-9 rounded-full" />
                </div>
            </header>
            <main className="flex-1 p-6">
                <Skeleton className="h-96 w-full" />
            </main>
        </div>
    );
  }

  if (!user) {
    return null; // Don't render anything while redirecting
  }
  
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
        <Link href="/client/dashboard" className="flex items-center gap-2">
            <Icons.logo className="size-6 text-accent" />
            <span className="text-lg font-semibold font-headline">
              TenantCheck
            </span>
             <span className="text-lg font-light text-muted-foreground font-headline">
              | Portal
            </span>
        </Link>
        <div className="ml-auto">
            <UserNav />
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-6 md:gap-8">
        {children}
      </main>
      <SupportChatWidget />
    </div>
  );
}
