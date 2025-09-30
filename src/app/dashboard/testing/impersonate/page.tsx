
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogIn, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { auth } from '@/lib/firebase';
import { signInWithCustomToken } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { ClientPortalWidget } from '@/components/testing/client-portal-widget';
import { EndUserPortalWidget } from '@/components/testing/end-user-portal-widget';
import { WorkflowWidget } from '@/components/testing/workflow-widget';
import { AnalystPortalWidget } from '@/components/testing/analyst-portal-widget';

type User = {
    uid: string;
    email?: string;
    role: string;
    tenantName: string | null;
}


export default function ImpersonateUserPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [impersonatingUid, setImpersonatingUid] = useState<string | null>(null);
    const { toast } = useToast();

    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/users');
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch users');
            }
            return data.users.sort((a: User, b: User) => (a.email || '').localeCompare(b.email || ''));
        } catch (err: any) {
            console.error(err);
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
        }
    };

    const ensureUserExists = async (allUsers: User[], email: string, role: string) => {
        if (!allUsers.some(u => u.email === email)) {
            try {
                const res = await fetch('/api/users/invite', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, role }),
                });
                 if (!res.ok) {
                    const data = await res.json();
                    if (data.error && data.error.includes('already exists')) {
                        return false;
                    }
                    throw new Error(data.error || `Failed to create ${role}`);
                }
                return true; // Indicates a user was created
            } catch (e: any) {
                console.error(`Failed to create user ${email}:`, e.message);
                setError(e.message);
                return false;
            }
        }
        return false;
    };


    useEffect(() => {
        let isMounted = true;

        const initialize = async () => {
            let initialUsers = await fetchUsers();
            if (!isMounted) return;

            const createdManager = await ensureUserExists(initialUsers, 'manager@example.com', 'Manager');
            const createdAnalystA = await ensureUserExists(initialUsers, 'analyst.a@example.com', 'Analyst');
            const createdAnalystB = await ensureUserExists(initialUsers, 'analyst.b@example.com', 'Analyst');

            if (createdManager || createdAnalystA || createdAnalystB) {
                toast({ title: 'Seeding Users', description: 'Default Manager and Analyst users have been created for testing.'});
                initialUsers = await fetchUsers(); 
            }
            
            if (isMounted) {
                setUsers(initialUsers);
            }
        };

        initialize();

        return () => { isMounted = false; };
    }, [toast]);


    const handleImpersonate = async (targetUid: string, targetEmail?: string) => {
        setImpersonatingUid(targetUid);
        try {
            const res = await fetch('/api/auth/impersonate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetUid }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Failed to start impersonation');
            }
            
            await auth.signOut();
            await signInWithCustomToken(auth, data.customToken);

            toast({
                title: 'Impersonation Started',
                description: `You are now logged in as ${targetEmail || 'user'}.`,
            });
            
        } catch (err: any) {
            toast({
                title: 'Impersonation Failed',
                description: err.message,
                variant: 'destructive',
            });
        } finally {
            setImpersonatingUid(null);
        }
    }

    const handleRefreshUsers = () => {
      fetchUsers().then(setUsers);
    }
    
    const clientUsers = users.filter(u => u.role === 'End User' && u.tenantName);
    const endUsers = users.filter(u => u.role === 'End User' && !u.tenantName);
    const analystUsers = users.filter(u => u.role === 'Analyst');

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">Live Workflow Dashboard</h1>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
                {error}
                {error.includes('credential') && (
                    <p className="mt-2">Please ensure your server-side Firebase Admin credentials are correctly set in your `.env` file.</p>
                )}
            </AlertDescription>
        </Alert>
    )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <ClientPortalWidget 
            users={clientUsers}
            onImpersonate={handleImpersonate}
            onUserCreated={handleRefreshUsers}
            isImpersonating={!!impersonatingUid}
        />

        <EndUserPortalWidget 
            users={endUsers}
            onImpersonate={handleImpersonate}
            isImpersonating={!!impersonatingUid}
        />

        <div className="lg:col-span-2">
            <WorkflowWidget 
                analysts={analystUsers}
            />
        </div>
        <div className="lg:col-span-2">
             <AnalystPortalWidget 
                users={analystUsers}
                onImpersonate={handleImpersonate}
                isImpersonating={!!impersonatingUid}
            />
        </div>
      </div>
    </div>
  );
}
