'use client';

import type { ReactNode } from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import { DashboardNav } from './nav';
import { UserNav } from '@/components/user-nav';
import Link from 'next/link';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Search, LogIn, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, User, signInWithCustomToken, getIdToken } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

function ImpersonationBanner() {
    const { toast } = useToast();
    const [impersonatorUid, setImpersonatorUid] = useState<string | null>(null);

    useEffect(() => {
        // A bit of a hack to read the cookie on the client
        const cookieValue = document.cookie
            .split('; ')
            .find(row => row.startsWith('impersonatorUid='))
            ?.split('=')[1];
        setImpersonatorUid(cookieValue || null);
    }, []);

    const stopImpersonating = async () => {
        const response = await fetch('/api/auth/stop-impersonating', { method: 'POST' });
        const data = await response.json();

        if (response.ok) {
            // Re-sign in with the original token.
            // This is a simplified approach. In a production app, you might handle token refresh differently.
            await auth.signOut(); // Sign out the impersonated user
            
            // Re-authenticating with the original token is complex from the client.
            // A full page reload is the most reliable way to force re-authentication
            // with the server-set cookies.
            document.cookie = 'firebaseIdToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            document.cookie = 'impersonatorUid=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            window.location.href = '/dashboard'; // Redirect and force reload

            toast({ title: 'Impersonation stopped.' });
        } else {
            toast({ title: 'Error', description: data.error, variant: 'destructive' });
        }
    };
    
    if (!impersonatorUid) {
        return null;
    }

    return (
        <div className="flex items-center justify-center gap-x-6 bg-yellow-500 px-6 py-2 sm:px-3.5">
            <div className="flex items-center text-sm leading-6 text-white">
                <AlertTriangle className="mr-2 h-5 w-5" />
                <p>
                    <strong>Impersonation Mode:</strong> You are currently viewing the app as another user.
                </p>
            </div>
             <Button size="sm" onClick={stopImpersonating} variant="outline" className="text-yellow-700">
                Stop Impersonating
            </Button>
        </div>
    );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        // Store the ID token in a cookie for server-side access
        const token = await getIdToken(user);
        document.cookie = `firebaseIdToken=${token}; path=/;`;
      } else {
        // Clear the cookie on logout
        document.cookie = 'firebaseIdToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        router.push('/');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
       <div className="flex min-h-screen w-full">
        <div className="hidden md:flex md:w-64 flex-col border-r">
            <div className="flex h-16 items-center px-6">
                <Skeleton className="h-6 w-32" />
            </div>
            <div className="flex flex-col gap-2 p-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
            </div>
        </div>
        <div className="flex flex-1 flex-col">
            <header className="flex h-16 items-center justify-between border-b px-6">
                <Skeleton className="h-8 w-8 md:hidden" />
                <div className="flex items-center gap-4">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-9 w-9 rounded-full" />
                </div>
            </header>
            <main className="flex-1 p-6">
                <Skeleton className="h-96 w-full" />
            </main>
        </div>
    </div>
    );
  }

  if (!user) {
    return null; // or a redirect component
  }
  
  return (
    <SidebarProvider>
      <Sidebar
        variant="inset"
        collapsible="icon"
        className="border-r-0 bg-sidebar text-sidebar-foreground"
      >
        <SidebarHeader>
          <Link href="/dashboard" className="flex items-center gap-2">
            <Icons.logo className="size-6 text-accent" />
            <span className="text-lg font-semibold font-headline text-sidebar-foreground">
              TenantCheck
            </span>
          </Link>
        </SidebarHeader>
        <SidebarContent className="p-2">
          <DashboardNav />
        </SidebarContent>
      </Sidebar>
      <SidebarInset className="bg-background">
         <ImpersonationBanner />
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-card/95 px-4 backdrop-blur-sm sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <SidebarTrigger className="sm:hidden" />
          
          <div className="relative ml-auto flex-1 md:grow-0">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="w-full rounded-lg bg-card pl-8 md:w-[200px] lg:w-[320px]"
            />
          </div>
          <UserNav />
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
