
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, AlertCircle, PlusCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InviteUserDialog } from '@/components/invite-user-dialog';
import { UserProfileSheet } from '@/components/user-profile-sheet';

type User = {
    uid: string;
    email?: string;
    displayName?: string;
    photoURL?: string;
    disabled: boolean;
    tenantId?: string;
    tenantName?: string | null;
    role: string;
    createdAt: string;
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isInviteDialogOpen, setInviteDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);


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

    useEffect(() => {
        fetchUsers();
    }, []);
    
    const handleUserInvited = () => {
        fetchUsers(); // Re-fetch the user list after a new user is invited
    }

    const handleRowClick = (user: User) => {
        setSelectedUser(user);
    }
    
    const handleSheetClose = () => {
        setSelectedUser(null);
    }

    const isCredentialError = error && (error.includes('credential') || error.includes('FIREBASE_PROJECT_ID'));

  return (
    <div className="flex-1 space-y-4">
        <InviteUserDialog 
            isOpen={isInviteDialogOpen} 
            onOpenChange={setInviteDialogOpen}
            onUserInvited={handleUserInvited}
        />
        <UserProfileSheet 
            user={selectedUser}
            isOpen={!!selectedUser}
            onOpenChange={handleSheetClose}
        />
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">User Management</h1>
        <Button className="bg-accent hover:bg-accent/90" onClick={() => setInviteDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          New User
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Authenticated Users</CardTitle>
          <CardDescription>
            This is a list of all users in Firebase Authentication. Click a user to see their profile.
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
                            <div className="mt-4 bg-gray-900 text-white p-4 rounded-md">
                                <p className="font-semibold">Action Required:</p>
                                <p className="mt-2 text-sm">To fetch the user list, you must provide server-side credentials.</p>
                                <ul className="list-disc list-inside text-xs mt-2 space-y-1">
                                    <li>Go to your Firebase Project Settings -&gt; Service accounts.</li>
                                    <li>Click "Generate new private key" to download a JSON file.</li>
                                    <li>Open the `.env` file in the project root.</li>
                                    <li>Copy the `project_id`, `client_email`, and `private_key` from the JSON file into your `.env` file.</li>
                                </ul>
                                <pre className="mt-3 text-xs bg-gray-800 p-2 rounded">
{`FIREBASE_PROJECT_ID="..."
FIREBASE_CLIENT_EMAIL="..."
FIREBASE_PRIVATE_KEY="..."`}
                                </pre>
                            </div>
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
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
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
                        <TableRow key={user.uid} onClick={() => handleRowClick(user)} className="cursor-pointer">
                            <TableCell className="font-medium">{user.email || 'N/A'}</TableCell>
                            <TableCell>
                                <Badge variant={user.role === 'Unassigned' ? 'destructive' : 'secondary'}>{user.role}</Badge>
                            </TableCell>
                            <TableCell>{user.tenantName || 'N/A'}</TableCell>
                            <TableCell className="text-right">
                               <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                                        <span className="sr-only">Open menu</span>
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={(e) => e.stopPropagation()}>Assign to Tenant</DropdownMenuItem>
                                        <DropdownMenuItem onClick={(e) => e.stopPropagation()}>Change Role</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
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
