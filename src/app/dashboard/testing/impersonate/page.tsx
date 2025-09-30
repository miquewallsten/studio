
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LogIn, AlertCircle, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { auth, db } from '@/lib/firebase';
import { signInWithCustomToken } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, query, where, onSnapshot, limit } from 'firebase/firestore';
import Link from 'next/link';

type User = {
    uid: string;
    email?: string;
    role: string;
    tenantName: string | null;
}

type Ticket = {
  id: string;
  endUserId: string;
}

function WorkflowGuide() {
    const [user, loadingUser] = useAuthState(auth);
    const [pendingFormUrl, setPendingFormUrl] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            const q = query(
                collection(db, "tickets"),
                where("endUserId", "==", user.uid),
                where("status", "==", "New"),
                limit(1)
            );
            const unsubscribe = onSnapshot(q, (snapshot) => {
                if (!snapshot.empty) {
                    const ticketId = snapshot.docs[0].id;
                    setPendingFormUrl(`/form/${ticketId}`);
                } else {
                    setPendingFormUrl(null);
                }
            });
            return () => unsubscribe();
        } else {
            setPendingFormUrl(null);
        }
    }, [user]);


    return (
        <Card>
            <CardHeader>
                <CardTitle>Live Workflow Guide</CardTitle>
                <CardDescription>
                    Use the impersonation list on the left to switch roles, then follow these steps using the real application pages.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-md">
                    <div>
                        <h4 className="font-semibold">Step 1: Create a Client Tenant</h4>
                        <p className="text-sm text-muted-foreground">As a Super Admin, create a new client company.</p>
                    </div>
                    <Button asChild variant="outline">
                        <Link href="/dashboard/admin/tenants/new" target="_blank">Go to Page <ArrowRight className="ml-2" /></Link>
                    </Button>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-md">
                    <div>
                        <h4 className="font-semibold">Step 2: Create a New Request</h4>
                        <p className="text-sm text-muted-foreground">Impersonate a client, then visit their portal to create a new request for an end-user.</p>
                    </div>
                     <Button asChild variant="outline" disabled={user?.customClaims?.role !== 'End User' && !user?.customClaims?.tenantId}>
                        <Link href="/client/dashboard" target="_blank">Go to Client Portal <ArrowRight className="ml-2" /></Link>
                    </Button>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-md">
                     <div>
                        <h4 className="font-semibold">Step 3: Fill Out the Form</h4>
                        <p className="text-sm text-muted-foreground">Impersonate the new end-user, then click the link to fill out their pending form.</p>
                    </div>
                     <Button asChild variant="outline" disabled={!pendingFormUrl}>
                        <Link href={pendingFormUrl || ""} target="_blank">Go to Form <ArrowRight className="ml-2" /></Link>
                    </Button>
                </div>
                 <div className="flex items-center justify-between p-3 border rounded-md">
                     <div>
                        <h4 className="font-semibold">Step 4: Manage the Ticket</h4>
                        <p className="text-sm text-muted-foreground">Impersonate a Manager to see the new ticket and assign it to an analyst.</p>
                    </div>
                     <Button asChild variant="outline">
                        <Link href="/dashboard/tickets" target="_blank">Go to Tickets <ArrowRight className="ml-2" /></Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
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
    
    // This function will create a user if they don't exist.
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
    }, []);


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
    
    const isCredentialError = error && (error.includes('credential') || error.includes('FIREBASE_PROJECT_ID'));

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">Live Testing Environment</h1>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-3">
             <CardHeader>
                <CardTitle>Impersonation Control</CardTitle>
                <CardDescription>
                Select a user to log in as. The entire application will reflect their role and permissions.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {error && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>{isCredentialError ? 'Configuration Required' : 'Error Fetching Users'}</AlertTitle>
                        <AlertDescription>
                            {error}
                            {isCredentialError && (
                                <p className="mt-2">Please ensure your server-side Firebase Admin credentials are correctly set in your `.env` file.</p>
                            )}
                        </AlertDescription>
                    </Alert>
                )}
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role / Tenant</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        <TableRow>
                            <TableCell colSpan={3} className="h-24 text-center">Loading users...</TableCell>
                        </TableRow>
                    ) : !error && users.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={3} className="h-24 text-center">No users found.</TableCell>
                        </TableRow>
                    ) : (
                        users.map(user => (
                            <TableRow key={user.uid} className={auth.currentUser?.uid === user.uid ? 'bg-muted/50' : ''}>
                                <TableCell className="font-medium text-xs truncate">{user.email || 'N/A'} {auth.currentUser?.uid === user.uid && '(You)'}</TableCell>
                                <TableCell>
                                    <Badge variant={user.role === 'End User' ? 'outline' : 'secondary'}>{user.tenantName || user.role}</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                <Button 
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleImpersonate(user.uid, user.email)}
                                        disabled={loading || impersonatingUid === user.uid || auth.currentUser?.uid === user.uid}
                                    >
                                        <LogIn className="mr-2 h-4 w-4" />
                                        {impersonatingUid === user.uid ? 'Logging in...' : 'Login as'}
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
            </CardContent>
        </Card>

        <div className="lg:col-span-4">
            <WorkflowGuide />
        </div>
      </div>
    </div>
  );
}

    