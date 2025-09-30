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
import { LogIn, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { auth } from '@/lib/firebase';
import { signInWithCustomToken } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

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
    const router = useRouter();

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch('/api/users');
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.error || 'Failed to fetch users');
                }
                setUsers(data.users);
            } catch (err: any) {
                console.error(err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
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
            
            // We have a custom token. Now sign out the current user and sign in with the new token.
            await auth.signOut();
            await signInWithCustomToken(auth, data.customToken);

            toast({
                title: 'Impersonation Started',
                description: `You are now logged in as ${targetEmail || 'user'}.`,
            });
            
            // Redirect to dashboard to refresh the entire app state as the new user
            router.push('/dashboard');

        } catch (err: any) {
            toast({
                title: 'Impersonation Failed',
                description: err.message,
                variant: 'destructive',
            });
            setImpersonatingUid(null);
        }
    }
    
    const isCredentialError = error && (error.includes('credential') || error.includes('FIREBASE_PROJECT_ID'));

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">Impersonate User</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Testing Control Panel</CardTitle>
          <CardDescription>
            Select a user to temporarily log in as them and view the application from their perspective. This is a Super Admin only feature.
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
                <TableHead>Role</TableHead>
                <TableHead>Assigned Tenant</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                {loading ? (
                    <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">Loading users...</TableCell>
                    </TableRow>
                ) : !error && users.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">No users found.</TableCell>
                    </TableRow>
                ) : (
                    users.map(user => (
                        <TableRow key={user.uid} className={auth.currentUser?.uid === user.uid ? 'bg-muted/50' : ''}>
                            <TableCell className="font-medium">{user.email || 'N/A'} {auth.currentUser?.uid === user.uid && '(You)'}</TableCell>
                            <TableCell>
                                <Badge variant={user.role === 'Unassigned' ? 'destructive' : 'secondary'}>{user.role}</Badge>
                            </TableCell>
                            <TableCell>{user.tenantName || 'N/A'}</TableCell>
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
    </div>
  );
}
