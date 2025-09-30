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
import { MoreHorizontal } from 'lucide-react';
import { useEffect, useState } from 'react';

type User = {
    uid: string;
    email?: string;
    role: string;
    tenantName: string | null;
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            try {
                const response = await fetch('/api/users');
                if (!response.ok) {
                    throw new Error('Failed to fetch users');
                }
                const data = await response.json();
                setUsers(data.users);
            } catch (error) {
                console.error(error);
                // Handle error (e.g., show a toast message)
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

  return (
    <div className="flex-1 space-y-4">
      <h1 className="text-3xl font-bold font-headline">User Management</h1>
      <Card>
        <CardHeader>
          <CardTitle>All Authenticated Users</CardTitle>
          <CardDescription>
            This is a list of all users in Firebase Authentication. From here, you can assign them to a client tenant.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                ) : users.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">No users found.</TableCell>
                    </TableRow>
                ) : (
                    users.map(user => (
                        <TableRow key={user.uid}>
                            <TableCell className="font-medium">{user.email || 'N/A'}</TableCell>
                            <TableCell>
                                <Badge variant={user.role === 'Unassigned' ? 'destructive' : 'secondary'}>{user.role}</Badge>
                            </TableCell>
                            <TableCell>{user.tenantName || 'N/A'}</TableCell>
                            <TableCell className="text-right">
                               <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                        <span className="sr-only">Open menu</span>
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem>Assign to Tenant</DropdownMenuItem>
                                        <DropdownMenuItem>Change Role</DropdownMenuItem>
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
